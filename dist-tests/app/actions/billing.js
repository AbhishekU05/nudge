"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSubscriptionCheckout = startSubscriptionCheckout;
exports.cancelSubscription = cancelSubscription;
exports.manageSubscription = manageSubscription;
exports.joinWaitlist = joinWaitlist;
/**
 * Billing actions for Dodo Payments Checkout flow (Milestone 5).
 */
const navigation_1 = require("next/navigation");
const cache_1 = require("next/cache");
const auth_1 = require("@/lib/auth");
const organization_billing_1 = require("@/lib/organization-billing");
const admin_1 = require("@/lib/supabase/admin");
const dodo_1 = require("@/lib/dodo");
const logger_1 = require("@/lib/logger");
async function startSubscriptionCheckout(formData) {
    try {
        const user = await (0, auth_1.requireUser)();
        const supabaseAdmin = (0, admin_1.createSupabaseAdminClient)();
        const org = await (0, organization_billing_1.getOrganizationBillingForUser)(supabaseAdmin, user.id);
        if (!org) {
            return { error: "No organization found." };
        }
        if (!(0, organization_billing_1.canManageOrganizationBilling)(org.role)) {
            return { error: "Only admins can manage billing." };
        }
        const plan = formData?.get("plan") || "monthly";
        let productId;
        let dodo;
        let configError = false;
        try {
            productId = (0, dodo_1.getDodoProductId)(plan);
            dodo = (0, dodo_1.getDodoClient)();
        }
        catch (error) {
            logger_1.logger.error({ message: "Dodo config error", context: "billing:checkout", error: error instanceof Error ? error.message : "Unknown error" });
            configError = true;
        }
        if (configError || !productId || !dodo) {
            return { error: "Payment gateway not configured." };
        }
        let session;
        let checkoutError = false;
        try {
            let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000";
            if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
                baseUrl = `https://${baseUrl}`;
            }
            session = await dodo.checkoutSessions.create({
                product_cart: [{ product_id: productId, quantity: 1 }],
                return_url: `${baseUrl}/settings/billing?success=true`,
                metadata: {
                    organization_id: org.id,
                    plan_type: plan,
                },
                customer: {
                    email: user.email,
                    name: user.user_metadata?.full_name || "Customer",
                }
            });
        }
        catch (error) {
            logger_1.logger.error({
                message: error instanceof Error ? error.message : "Failed to create checkout session",
                context: "billing:checkout",
                organization_id: org.id
            });
            checkoutError = true;
        }
        if (checkoutError) {
            return { error: "Unable to start checkout. Please try again." };
        }
        if (session && session.checkout_url) {
            return { url: session.checkout_url };
        }
        else {
            return { error: "Unable to start checkout. Invalid response." };
        }
    }
    catch (err) {
        console.error("Fatal error in startSubscriptionCheckout:", err);
        return { error: "Server Error: Unable to process checkout." };
    }
}
async function cancelSubscription() {
    const user = await (0, auth_1.requireUser)();
    const supabaseAdmin = (0, admin_1.createSupabaseAdminClient)();
    const org = await (0, organization_billing_1.getOrganizationBillingForUser)(supabaseAdmin, user.id);
    if (!org) {
        return { error: "No organization found." };
    }
    if (!(0, organization_billing_1.canManageOrganizationBilling)(org.role)) {
        return { error: "Only admins can manage billing." };
    }
    if (!org.dodo_subscription_id) {
        return { error: "No active subscription to cancel." };
    }
    let dodo;
    let configError = false;
    try {
        dodo = (0, dodo_1.getDodoClient)();
    }
    catch (error) {
        configError = true;
    }
    if (configError || !dodo) {
        return { error: "Payment gateway not configured." };
    }
    return { error: "Cancellation must be done through customer portal." };
}
async function manageSubscription() {
    const user = await (0, auth_1.requireUser)();
    const supabaseAdmin = (0, admin_1.createSupabaseAdminClient)();
    const org = await (0, organization_billing_1.getOrganizationBillingForUser)(supabaseAdmin, user.id);
    if (!org) {
        (0, navigation_1.redirect)("/settings/billing?error=No+organization+found.");
    }
    if (!org.dodo_customer_id) {
        (0, navigation_1.redirect)("/settings/billing?error=No+billing+history+found.");
    }
    let dodo;
    let configError = false;
    try {
        dodo = (0, dodo_1.getDodoClient)();
    }
    catch (error) {
        configError = true;
    }
    if (configError || !dodo) {
        (0, navigation_1.redirect)("/settings/billing?error=Payment+gateway+not+configured.");
    }
    (0, navigation_1.redirect)("/settings/billing?error=Customer+portal+not+yet+supported.");
}
async function joinWaitlist() {
    (0, cache_1.revalidatePath)("/settings/billing");
    (0, navigation_1.redirect)("/settings/billing?success=You've been added to the waitlist!");
}
