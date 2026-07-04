import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UnwrapWebhookEvent } from "dodopayments/resources";

import { logger } from "@/lib/logger";
import type { PricingPlanType, SubscriptionStatus } from "@/lib/types";

type ProcessResult = {
  duplicate: boolean;
  organizationId: string | null;
};

const SUBSCRIPTION_EVENT_TYPES = new Set<string>([
  "subscription.active",
  "subscription.updated",
  "subscription.on_hold",
  "subscription.renewed",
  "subscription.plan_changed",
  "subscription.cancelled",
  "subscription.failed",
  "subscription.expired",
]);

type SubscriptionEvent = Extract<
  UnwrapWebhookEvent,
  { type: `subscription.${string}` }
>;

function isSubscriptionEvent(event: UnwrapWebhookEvent): event is SubscriptionEvent {
  return SUBSCRIPTION_EVENT_TYPES.has(event.type);
}

export function mapDodoSubscriptionStatus(status: string): SubscriptionStatus {
  if (status === "cancelled") return "canceled";

  const supported = new Set<SubscriptionStatus>([
    "pending",
    "active",
    "on_hold",
    "failed",
    "expired",
  ]);

  if (!supported.has(status as SubscriptionStatus)) {
    throw new Error(`Unsupported Dodo subscription status: ${status}`);
  }

  return status as SubscriptionStatus;
}

export function parseCreditBalance(value: string): number {
  const balance = Number(value);

  if (!Number.isSafeInteger(balance) || balance < 0) {
    throw new Error(
      `Dodo credit balance must be a non-negative integer; received "${value}".`,
    );
  }

  return balance;
}

function getPlanType(
  metadata: Record<string, string>,
  productId: string,
): PricingPlanType | null {
  if (
    process.env.DODO_PAYMENTS_MONTHLY_PRODUCT_ID === productId ||
    process.env.DODO_PAYMENTS_TEST_MONTHLY_PRODUCT_ID === productId
  ) return "monthly";
  
  if (
    process.env.DODO_PAYMENTS_ANNUAL_PRODUCT_ID === productId ||
    process.env.DODO_PAYMENTS_TEST_ANNUAL_PRODUCT_ID === productId
  ) return "annual";

  if (metadata?.plan_type === "monthly" || metadata?.plan_type === "annual") {
    return metadata.plan_type;
  }
  
  return null;
}

async function findOrganizationId(
  supabase: SupabaseClient,
  params: {
    metadata?: Record<string, string>;
    customerId?: string;
    subscriptionId?: string;
  },
): Promise<string | null> {
  const metadataId = params.metadata?.organization_id;
  const lookups = [
    metadataId ? { column: "id", value: metadataId } : null,
    params.subscriptionId
      ? { column: "dodo_subscription_id", value: params.subscriptionId }
      : null,
    params.customerId
      ? { column: "dodo_customer_id", value: params.customerId }
      : null,
  ].filter((lookup): lookup is { column: string; value: string } => Boolean(lookup));

  for (const lookup of lookups) {
    const { data, error } = await supabase
      .from("organizations")
      .select("id")
      .eq(lookup.column, lookup.value)
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new Error(`Unable to find organization for Dodo webhook: ${error.message}`);
    }

    if (data) return data.id;
  }

  return null;
}

/**
 * Fire a server-side conversion event to Affonso when a subscription first activates.
 * Uses the affonso_referral cookie value stored by the pixel on the client, which
 * Dodo should pass through in the checkout metadata (key: "affonso_referral").
 * Falls back gracefully — never throws, so billing is never blocked.
 */
async function trackAffonsoConversion(params: {
  eventId: string;
  email: string;
  referral: string | null | undefined;
  amountCents: number;
  currency: string;
}): Promise<void> {
  const apiKey = process.env.AFFONSO_API_KEY;
  if (!apiKey || !params.referral) return;

  try {
    const res = await fetch("https://api.affonso.io/v1/conversions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        referral: params.referral,
        email: params.email,
        event_id: params.eventId, // idempotency key
        revenue: params.amountCents / 100,
        currency: params.currency.toUpperCase(),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error({ message: `Affonso conversion failed: ${res.status} ${body}`, context: "affonso:conversion" });
    }
  } catch (err) {
    logger.error({ message: `Affonso conversion error: ${String(err)}`, context: "affonso:conversion" });
  }
}

async function processSubscriptionEvent(
  supabase: SupabaseClient,
  event: SubscriptionEvent,
): Promise<string> {
  const subscription = event.data;
  const organizationId = await findOrganizationId(supabase, {
    metadata: subscription.metadata,
    customerId: subscription.customer.customer_id,
    subscriptionId: subscription.subscription_id,
  });

  if (!organizationId) {
    throw new Error(
      `No organization matches Dodo subscription ${subscription.subscription_id}.`,
    );
  }

  const planType = getPlanType(subscription.metadata, subscription.product_id);
  const update: Record<string, unknown> = {
    dodo_customer_id: subscription.customer.customer_id,
    dodo_subscription_id: subscription.subscription_id,
    dodo_subscription_status: mapDodoSubscriptionStatus(subscription.status),
    dodo_next_billing_date: (subscription as any).next_billing_date ?? null,
    updated_at: new Date().toISOString(),
  };

  if (planType) update.plan_type = planType;

  const { error } = await supabase
    .from("organizations")
    .update(update)
    .eq("id", organizationId);

  if (error) {
    throw new Error(`Unable to update organization subscription: ${error.message}`);
  }

  // Track affiliate conversion on first activation only
  if (event.type === "subscription.active") {
    const meta = subscription.metadata as Record<string, string> | undefined;
    await trackAffonsoConversion({
      eventId: subscription.subscription_id,
      email: subscription.customer.email,
      referral: meta?.["affonso_referral"] ?? null,
      amountCents: typeof subscription.recurring_pre_tax_amount === "number"
        ? subscription.recurring_pre_tax_amount
        : 0,
      currency: subscription.currency ?? "USD",
    });
  }

  return organizationId;
}

async function processCreditAddedEvent(
  supabase: SupabaseClient,
  event: Extract<UnwrapWebhookEvent, { type: "credit.added" }>,
): Promise<string> {
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

export async function processDodoWebhookEvent(
  supabase: SupabaseClient,
  eventId: string,
  event: UnwrapWebhookEvent,
): Promise<ProcessResult> {
  const { data: processed, error: lookupError } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle<{ id: string }>();

  if (lookupError) {
    throw new Error(`Unable to check webhook idempotency: ${lookupError.message}`);
  }

  if (processed) return { duplicate: true, organizationId: null };

  let organizationId: string | null = null;

  if (isSubscriptionEvent(event)) {
    organizationId = await processSubscriptionEvent(supabase, event);
  } else if (event.type === "credit.added") {
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
