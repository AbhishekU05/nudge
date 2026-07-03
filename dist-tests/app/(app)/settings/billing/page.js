"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BillingPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const card_1 = require("@/components/ui/card");
const billing_1 = require("@/app/actions/billing");
const checkout_button_1 = require("./checkout-button");
const auth_1 = require("@/lib/auth");
const organization_billing_1 = require("@/lib/organization-billing");
const server_1 = require("@/lib/supabase/server");
const admin_1 = require("@/lib/supabase/admin");
// display billing message
// TODO: fix wording
function getBillingMessage(error) {
    if (!error)
        return null;
    if (error === "subscription_required") {
        return "Start a subscription to create or resume reminders.";
    }
    if (error === "no_subscription") {
        return "No active subscription yet.";
    }
    if (error === "no_portal_url") {
        return "Billing is temporarily unavailable. Try again in a moment.";
    }
    return error;
}
async function BillingPage({ searchParams, }) {
    const user = await (0, auth_1.requireUser)();
    const { canceled, error, success } = await searchParams;
    const supabase = await (0, server_1.createSupabaseServerClient)();
    let org = null;
    let createdAt = new Date().toISOString();
    try {
        const supabaseAdmin = (0, admin_1.createSupabaseAdminClient)();
        org = await (0, organization_billing_1.getOrganizationBillingForUser)(supabaseAdmin, user.id);
        const { data: profile } = await supabase
            .from("profiles")
            .select("created_at")
            .eq("user_id", user.id)
            .single();
        if (profile)
            createdAt = profile.created_at;
    }
    catch (err) {
        org = null;
    }
    const rawStatus = org?.dodo_subscription_status ?? "none";
    const billingMessage = getBillingMessage(error);
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const trialDaysLeft = Math.max(0, 7 - diffDays);
    let displayStatus = "";
    let renewsText = "Not scheduled";
    let renewsLabel = "Renews";
    if (rawStatus === "active" || rawStatus === "on_hold") {
        displayStatus = org?.plan_type === "annual" ? "Annual Active" : "Monthly Active";
        renewsText = "Active"; // We don't have renewsAt stored natively yet
    }
    else if (trialDaysLeft > 0) {
        displayStatus = "Trial";
        renewsLabel = "Trial ends";
        const trialEndDate = new Date(createdDate);
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        renewsText = trialEndDate.toLocaleDateString();
    }
    else {
        displayStatus = "Inactive";
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-6xl space-y-8", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold tracking-tight text-zinc-50", children: "Billing & Plans" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-zinc-400", children: "Manage your workspace subscription and payment details." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [success ? ((0, jsx_runtime_1.jsx)("p", { className: "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200", children: success === "true" || success === "" ? "Payment successful. Your plan will update shortly." : success })) : null, canceled ? ((0, jsx_runtime_1.jsx)("p", { className: "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-400", children: "Checkout canceled. No changes made." })) : null, billingMessage ? ((0, jsx_runtime_1.jsx)("p", { className: "rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200", children: billingMessage })) : null] }), !org?.domain && ((0, jsx_runtime_1.jsx)("div", { className: "rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-200 shadow-sm", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { className: "h-5 w-5 text-amber-400 shrink-0 mt-0.5" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { className: "block font-semibold text-amber-100 text-base mb-1", children: "Personal Email Detected" }), "Because you signed up with a personal email address, this is an isolated solo workspace. You will not be able to invite or collaborate with team members for free on this workspace."] })] }) })), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/10 bg-white/[0.03] max-w-4xl", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2 text-2xl", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CreditCard, { className: "h-5 w-5 text-primary" }), "Plan status"] }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Current access and renewal details for your workspace." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-3 sm:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: "Status" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm font-semibold capitalize text-zinc-100", children: displayStatus })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: renewsLabel }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm font-semibold text-zinc-100", children: renewsText })] })] }) })] }), (0, jsx_runtime_1.jsxs)("section", { className: "grid gap-6 sm:grid-cols-2 lg:max-w-4xl", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 flex flex-col", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-widest text-zinc-500", children: "Monthly" }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-4 flex items-end gap-2 text-4xl font-bold text-zinc-50", children: ["$29 ", (0, jsx_runtime_1.jsx)("span", { className: "text-base font-medium text-zinc-500 mb-1", children: "/ month" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-zinc-500", children: "for your entire team \u2014 cancel any time" }), (0, jsx_runtime_1.jsxs)("ul", { className: "mt-8 space-y-3 text-sm text-zinc-400 flex-1", children: [(0, jsx_runtime_1.jsx)("li", { className: "font-medium text-zinc-300 mb-1", children: "Everything included:" }), [
                                        "Unlimited team members",
                                        "Unlimited clients & invoices",
                                        "Automated reminders & sequences",
                                        "Xero & QuickBooks sync",
                                        "Client portal & payment logging",
                                        "Activity timeline & CSV exports",
                                    ].map((item) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-indigo-400", children: "\u2713" }), " ", item] }, item)))] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-8", children: rawStatus === "active" && org?.plan_type === "monthly" ? ((0, jsx_runtime_1.jsx)(checkout_button_1.CheckoutButton, { action: billing_1.cancelSubscription, variant: "cancel", className: "w-full text-red-400 hover:text-red-300 h-12", children: "Cancel subscription" })) : ((0, jsx_runtime_1.jsx)(checkout_button_1.CheckoutButton, { action: billing_1.startSubscriptionCheckout, plan: "monthly", variant: "monthly", className: "w-full h-12 bg-white/10 hover:bg-white/20 text-zinc-100", children: rawStatus === "active" ? "Switch to Monthly" : "Subscribe Monthly" })) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "relative rounded-xl border border-emerald-500/40 bg-emerald-500/[0.06] p-8 overflow-hidden flex flex-col", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 right-0 bg-emerald-500 text-emerald-950 text-[10px] font-bold px-3 py-1.5 rounded-bl-lg uppercase tracking-wider", children: "2 Months Free" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-widest text-emerald-400", children: "Annual" }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-4 flex items-end gap-2 text-4xl font-bold text-zinc-50", children: ["$290 ", (0, jsx_runtime_1.jsx)("span", { className: "text-base font-medium text-emerald-500/60 mb-1", children: "/ year" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-emerald-500/60", children: "for your entire team \u2014 save $58" }), (0, jsx_runtime_1.jsxs)("ul", { className: "mt-8 space-y-3 text-sm text-zinc-400 flex-1", children: [(0, jsx_runtime_1.jsx)("li", { className: "font-medium text-emerald-300/80 mb-1", children: "Everything in Monthly, plus:" }), [
                                        "Unlimited team members",
                                        "Priority support",
                                        "2 months free",
                                    ].map((item) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-emerald-400", children: "\u2713" }), " ", item] }, item)))] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-8", children: rawStatus === "active" && org?.plan_type === "annual" ? ((0, jsx_runtime_1.jsx)(checkout_button_1.CheckoutButton, { action: billing_1.cancelSubscription, variant: "cancel", className: "w-full text-red-400 hover:text-red-300 h-12", children: "Cancel subscription" })) : ((0, jsx_runtime_1.jsx)(checkout_button_1.CheckoutButton, { action: billing_1.startSubscriptionCheckout, plan: "annual", variant: "annual", className: "w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12", children: rawStatus === "active" ? "Upgrade to Annual" : "Subscribe Annual" })) })] })] })] }));
}
