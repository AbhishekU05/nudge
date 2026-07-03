"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CustomersPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const container_1 = require("@/components/site/container");
const dashboard_client_1 = require("@/components/site/dashboard-client");
const button_1 = require("@/components/ui/button");
const auth_1 = require("@/lib/auth");
const payments_1 = require("@/lib/payments");
const pricing_1 = require("@/lib/pricing");
const server_1 = require("@/lib/supabase/server");
const utils_1 = require("@/lib/utils");
const currency_selector_1 = require("@/components/site/currency-selector");
// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
const utils_2 = require("@/lib/utils");
function getPlanLabel({ hasSubscription, subscriptionStatus, trialDaysLeft, }) {
    if (hasSubscription && trialDaysLeft > 0) {
        return `${trialDaysLeft} trial day${trialDaysLeft === 1 ? "" : "s"} left`;
    }
    if (hasSubscription)
        return "Active plan";
    return subscriptionStatus === "none" ? "No active plan" : subscriptionStatus;
}
function Notice({ children, variant, }) {
    return ((0, jsx_runtime_1.jsx)("p", { className: (0, utils_1.cn)("rounded-2xl border px-4 py-3 text-sm", variant === "success" &&
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-200", variant === "error" && "border-red-500/20 bg-red-500/10 text-red-200"), role: variant === "error" ? "alert" : undefined, children: children }));
}
// ──────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────
async function CustomersPage({ searchParams, }) {
    const user = await (0, auth_1.requireUser)();
    const { error, success, groupId } = await searchParams;
    const monthlyPrice = await (0, pricing_1.getLocalizedMonthlyPrice)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    let customers = null;
    let customerEvents = null;
    let profile = null;
    let xeroIntegration = null;
    let quickbooksIntegration = null;
    let activeGroup = null;
    try {
        const [customersRes, eventsRes, profileRes, xeroRes, qbRes, customerGroupsRes, groupsRes] = await Promise.all([
            supabase
                .from("invoices")
                .select("*")
                .order("created_at", { ascending: false })
                .returns(),
            supabase
                .from("customer_events")
                .select("*")
                .order("created_at", { ascending: false })
                .returns(),
            supabase
                .from("profiles")
                .select("razorpay_subscription_status, razorpay_renews_at, created_at")
                .eq("user_id", user.id)
                .maybeSingle(),
            supabase
                .from("integrations")
                .select("provider")
                .eq("user_id", user.id)
                .eq("provider", "xero")
                .maybeSingle(),
            supabase
                .from("integrations")
                .select("provider")
                .eq("user_id", user.id)
                .eq("provider", "quickbooks")
                .maybeSingle(),
            supabase
                .from("customer_groups")
                .select("*"),
            supabase
                .from("groups")
                .select("*"),
        ]);
        customers = customersRes.data;
        customerEvents = eventsRes.data;
        profile = profileRes.data;
        xeroIntegration = xeroRes.data;
        quickbooksIntegration = qbRes.data;
        if (groupId && customers) {
            const customerGroupsList = customerGroupsRes.data || [];
            const groupsList = groupsRes.data || [];
            activeGroup = groupsList.find((g) => g.id === groupId) || null;
            const groupCustomerIds = customerGroupsList
                .filter((cg) => cg.group_id === groupId)
                .map((cg) => cg.customer_id);
            customers = customers.filter((c) => groupCustomerIds.includes(c.customer_id || ""));
        }
    }
    catch (err) {
        // Graceful fallback
    }
    const logsByCustomer = new Map();
    const followupsByCustomer = new Map();
    for (const event of customerEvents ?? []) {
        if (event.event_type === "payment") {
            const payment = {
                id: event.id,
                invoice_id: event.invoice_id,
                customer_id: event.customer_id,
                user_id: event.user_id,
                amount: Number(event.amount),
                currency: event.currency ?? "USD",
                source: event.payment_source ?? "user",
                created_at: event.created_at,
            };
            const existing = logsByCustomer.get(event.customer_id) ?? [];
            existing.push(payment);
            logsByCustomer.set(event.customer_id, existing);
            continue;
        }
        if (event.event_type === "followup") {
            const followup = {
                id: event.id,
                invoice_id: event.invoice_id,
                customer_id: event.customer_id,
                user_id: event.user_id,
                followup_date: event.event_date,
                method: event.followup_method ?? "other",
                note: event.note,
                outcome: event.followup_outcome ?? "no_response",
                created_at: event.created_at,
            };
            const existing = followupsByCustomer.get(event.customer_id) ?? [];
            existing.push(followup);
            followupsByCustomer.set(event.customer_id, existing);
        }
    }
    const _allCustomers = (customers ?? []).map((customer) => ({
        ...customer,
        payment_history: logsByCustomer.get(customer.id) ?? [],
        followup_history: followupsByCustomer.get(customer.id) ?? [],
    }));
    const uniqueCurrencies = Array.from(new Set(_allCustomers.map(c => c.currency || 'USD'))).sort();
    const searchParamsAwaited = await searchParams;
    const urlCurrency = searchParamsAwaited.currency;
    const selectedCurrency = urlCurrency || (uniqueCurrencies.includes('USD') ? 'USD' : uniqueCurrencies[0] || 'USD');
    const allCustomers = _allCustomers.filter(c => (c.currency || 'USD') === selectedCurrency);
    const subscriptionStatus = profile?.razorpay_subscription_status ?? "none";
    const hasSubscription = (0, payments_1.hasActiveSubscription)(subscriptionStatus, profile?.created_at, profile?.razorpay_renews_at);
    const isDevelopment = process.env.NODE_ENV === "development";
    const renewsAt = profile?.razorpay_renews_at
        ? new Date(profile.razorpay_renews_at).toLocaleDateString()
        : null;
    const displayName = (0, utils_2.getDisplayName)(user.user_metadata?.full_name, user.email?.split("@")[0] ?? "Profile");
    let trialDaysLeft = 0;
    if (hasSubscription && subscriptionStatus !== "active") {
        trialDaysLeft = (0, payments_1.getTrialDaysLeft)(profile?.created_at, subscriptionStatus, profile?.razorpay_renews_at);
    }
    const planLabel = getPlanLabel({ hasSubscription, subscriptionStatus, trialDaysLeft });
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex min-h-screen flex-col", children: (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-8 sm:py-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [activeGroup && ((0, jsx_runtime_1.jsx)("div", { className: "mb-2", children: (0, jsx_runtime_1.jsxs)("span", { className: "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border border-zinc-800 bg-zinc-900/50 text-zinc-300", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-2 h-2 rounded-full shadow-sm", style: { backgroundColor: activeGroup.color || "#3b82f6" } }), activeGroup.name] }) })), (0, jsx_runtime_1.jsx)("h1", { className: "mt-4 text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl", children: "Invoices" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 max-w-2xl text-base leading-7 text-zinc-500", children: "Track what invoices owe, log payments, record promises, and follow up \u2014 all in one place." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex shrink-0 flex-col gap-3 sm:items-end", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-end w-full", children: (0, jsx_runtime_1.jsx)(currency_selector_1.CurrencySelector, { currencies: uniqueCurrencies, selected: selectedCurrency }) }), (0, jsx_runtime_1.jsx)(link_1.default, { href: hasSubscription ? "/invoices/new" : "/settings/billing", className: "w-full sm:w-auto", children: (0, jsx_runtime_1.jsxs)(button_1.Button, { className: "w-full sm:w-auto gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserRound, { className: "h-4 w-4" }), "Add invoice"] }) })] })] }), (success || error) && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-6 space-y-3", children: [success && (0, jsx_runtime_1.jsx)(Notice, { variant: "success", children: success }), error && (0, jsx_runtime_1.jsx)(Notice, { variant: "error", children: error })] })), (0, jsx_runtime_1.jsx)(dashboard_client_1.DashboardClient, { customers: allCustomers, hasSubscription: hasSubscription, isDevelopment: isDevelopment, currency: selectedCurrency })] }) }) }));
}
