"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDodoSubscriptionStatus = mapDodoSubscriptionStatus;
exports.parseCreditBalance = parseCreditBalance;
exports.processDodoWebhookEvent = processDodoWebhookEvent;
require("server-only");
const SUBSCRIPTION_EVENT_TYPES = new Set([
    "subscription.active",
    "subscription.updated",
    "subscription.on_hold",
    "subscription.renewed",
    "subscription.plan_changed",
    "subscription.cancelled",
    "subscription.failed",
    "subscription.expired",
]);
function isSubscriptionEvent(event) {
    return SUBSCRIPTION_EVENT_TYPES.has(event.type);
}
function mapDodoSubscriptionStatus(status) {
    if (status === "cancelled")
        return "canceled";
    const supported = new Set([
        "pending",
        "active",
        "on_hold",
        "failed",
        "expired",
    ]);
    if (!supported.has(status)) {
        throw new Error(`Unsupported Dodo subscription status: ${status}`);
    }
    return status;
}
function parseCreditBalance(value) {
    const balance = Number(value);
    if (!Number.isSafeInteger(balance) || balance < 0) {
        throw new Error(`Dodo credit balance must be a non-negative integer; received "${value}".`);
    }
    return balance;
}
function getPlanType(metadata, productId) {
    if (metadata.plan_type === "monthly" || metadata.plan_type === "annual") {
        return metadata.plan_type;
    }
    if (process.env.DODO_PAYMENTS_MONTHLY_PRODUCT_ID === productId)
        return "monthly";
    if (process.env.DODO_PAYMENTS_ANNUAL_PRODUCT_ID === productId)
        return "annual";
    return null;
}
async function findOrganizationId(supabase, params) {
    const metadataId = params.metadata?.organization_id;
    const lookups = [
        metadataId ? { column: "id", value: metadataId } : null,
        params.subscriptionId
            ? { column: "dodo_subscription_id", value: params.subscriptionId }
            : null,
        params.customerId
            ? { column: "dodo_customer_id", value: params.customerId }
            : null,
    ].filter((lookup) => Boolean(lookup));
    for (const lookup of lookups) {
        const { data, error } = await supabase
            .from("organizations")
            .select("id")
            .eq(lookup.column, lookup.value)
            .maybeSingle();
        if (error) {
            throw new Error(`Unable to find organization for Dodo webhook: ${error.message}`);
        }
        if (data)
            return data.id;
    }
    return null;
}
async function processSubscriptionEvent(supabase, event) {
    const subscription = event.data;
    const organizationId = await findOrganizationId(supabase, {
        metadata: subscription.metadata,
        customerId: subscription.customer.customer_id,
        subscriptionId: subscription.subscription_id,
    });
    if (!organizationId) {
        throw new Error(`No organization matches Dodo subscription ${subscription.subscription_id}.`);
    }
    const planType = getPlanType(subscription.metadata, subscription.product_id);
    const update = {
        dodo_customer_id: subscription.customer.customer_id,
        dodo_subscription_id: subscription.subscription_id,
        dodo_subscription_status: mapDodoSubscriptionStatus(subscription.status),
        updated_at: new Date().toISOString(),
    };
    if (planType)
        update.plan_type = planType;
    const { error } = await supabase
        .from("organizations")
        .update(update)
        .eq("id", organizationId);
    if (error) {
        throw new Error(`Unable to update organization subscription: ${error.message}`);
    }
    return organizationId;
}
async function processCreditAddedEvent(supabase, event) {
    const credit = event.data;
    const organizationId = await findOrganizationId(supabase, {
        metadata: credit.metadata,
        customerId: credit.customer_id,
    });
    if (!organizationId) {
        throw new Error(`No organization matches Dodo customer ${credit.customer_id}.`);
    }
    // Dodo supplies the post-transaction balance. Storing that absolute value keeps
    // retries and concurrent duplicate deliveries safe without incrementing twice.
    const { error } = await supabase
        .from("organizations")
        .update({
        credits_balance: parseCreditBalance(credit.balance_after),
        updated_at: new Date().toISOString(),
    })
        .eq("id", organizationId);
    if (error) {
        throw new Error(`Unable to update organization credits: ${error.message}`);
    }
    return organizationId;
}
async function processDodoWebhookEvent(supabase, eventId, event) {
    const { data: processed, error: lookupError } = await supabase
        .from("webhook_events")
        .select("id")
        .eq("id", eventId)
        .maybeSingle();
    if (lookupError) {
        throw new Error(`Unable to check webhook idempotency: ${lookupError.message}`);
    }
    if (processed)
        return { duplicate: true, organizationId: null };
    let organizationId = null;
    if (isSubscriptionEvent(event)) {
        organizationId = await processSubscriptionEvent(supabase, event);
    }
    else if (event.type === "credit.added") {
        organizationId = await processCreditAddedEvent(supabase, event);
    }
    const { error: insertError } = await supabase.from("webhook_events").insert({
        id: eventId,
        type: event.type,
    });
    // A concurrent delivery may have completed the same absolute update first.
    if (insertError && insertError.code !== "23505") {
        throw new Error(`Unable to store processed webhook: ${insertError.message}`);
    }
    return {
        duplicate: insertError?.code === "23505",
        organizationId,
    };
}
