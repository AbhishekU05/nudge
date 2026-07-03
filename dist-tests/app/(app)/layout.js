"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AppLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
const app_sidebar_1 = require("@/components/site/app-sidebar");
const utils_1 = require("@/lib/utils");
async function AppLayout({ children, }) {
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    let subscriptionStatus = "none";
    let hasXero = false;
    let hasQuickBooks = false;
    let groups = [];
    let totalCustomers = 0;
    try {
        const [profileRes, integrationsRes, groupsRes, customersRes] = await Promise.all([
            supabase
                .from("profiles")
                .select("razorpay_subscription_status")
                .eq("user_id", user.id)
                .maybeSingle(),
            supabase
                .from("integrations")
                .select("provider")
                .eq("user_id", user.id),
            supabase
                .from("groups")
                .select("*, customer_groups(count)")
                .order("name", { ascending: true }),
            supabase
                .from("clients")
                .select("id", { count: "exact", head: true })
        ]);
        if (profileRes.data?.razorpay_subscription_status) {
            subscriptionStatus = profileRes.data.razorpay_subscription_status;
        }
        if (integrationsRes.data) {
            hasXero = integrationsRes.data.some(i => i.provider === "xero");
            hasQuickBooks = integrationsRes.data.some(i => i.provider === "quickbooks");
        }
        if (groupsRes.data) {
            groups = groupsRes.data.map(g => ({
                ...g,
                customerCount: g.customer_groups?.[0]?.count ?? 0
            }));
        }
        if (customersRes.count) {
            totalCustomers = customersRes.count;
        }
    }
    catch (e) {
        // Graceful fallback
    }
    const displayName = (0, utils_1.getDisplayName)(user.user_metadata?.full_name, user.email?.split("@")[0] ?? "Profile");
    const initials = (0, utils_1.getInitials)(displayName);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex min-h-screen bg-background text-foreground", children: [(0, jsx_runtime_1.jsx)(app_sidebar_1.AppSidebar, { user: {
                    email: user.email || "",
                    displayName,
                    initials,
                }, subscriptionStatus: subscriptionStatus, hasXero: hasXero, hasQuickBooks: hasQuickBooks, groups: groups, totalCustomers: totalCustomers }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 flex flex-col min-w-0", children: children })] }));
}
