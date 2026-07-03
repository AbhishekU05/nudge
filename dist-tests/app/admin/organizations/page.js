"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminOrganizations;
const jsx_runtime_1 = require("react/jsx-runtime");
const admin_1 = require("@/lib/supabase/admin");
const date_fns_1 = require("date-fns");
const lucide_react_1 = require("lucide-react");
const cache_1 = require("next/cache");
const client_1 = require("@/lib/inngest/client");
async function AdminOrganizations() {
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { data: orgs, error } = await supabase
        .from("organizations")
        .select(`
      *,
      integrations(provider, is_active, last_synced_at)
    `)
        .order("created_at", { ascending: false });
    if (error) {
        return (0, jsx_runtime_1.jsxs)("div", { className: "text-red-500", children: ["Error loading organizations: ", error.message] });
    }
    async function forceSync(formData) {
        "use server";
        const orgId = formData.get("orgId");
        const provider = formData.get("provider");
        if (provider === "xero") {
            await client_1.inngest.send({
                name: "app/sync-xero",
                data: { organization_id: orgId },
            });
        }
        else if (provider === "quickbooks") {
            await client_1.inngest.send({
                name: "app/sync-quickbooks",
                data: { organization_id: orgId },
            });
        }
        (0, cache_1.revalidatePath)("/admin/organizations");
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold text-gray-900", children: "Organizations" }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left text-sm", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-gray-50 border-b border-gray-200 text-gray-600 font-medium", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Organization" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Domain" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Subscription" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Integrations" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4 text-right", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-gray-200", children: orgs?.map((org) => ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50/50", children: [(0, jsx_runtime_1.jsxs)("td", { className: "px-6 py-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "font-medium text-gray-900", children: org.name }), (0, jsx_runtime_1.jsx)("div", { className: "text-gray-500 text-xs font-mono mt-1", children: org.id })] }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: org.domain ? ((0, jsx_runtime_1.jsx)("span", { className: "bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs", children: org.domain })) : ((0, jsx_runtime_1.jsx)("span", { className: "text-gray-400 italic", children: "None" })) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1", children: [(0, jsx_runtime_1.jsx)("span", { className: `inline-flex w-fit px-2 py-1 rounded text-xs font-medium ${org.dodo_subscription_status === "active" ? "bg-green-100 text-green-700" :
                                                            org.dodo_subscription_status ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`, children: org.dodo_subscription_status || "No Plan" }), org.plan_type && (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-gray-500 capitalize", children: org.plan_type })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-2", children: [org.integrations?.map((int) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-xs", children: [(0, jsx_runtime_1.jsx)("span", { className: `w-2 h-2 rounded-full ${int.is_active ? "bg-green-500" : "bg-red-500"}` }), (0, jsx_runtime_1.jsx)("span", { className: "capitalize font-medium", children: int.provider }), (0, jsx_runtime_1.jsx)("span", { className: "text-gray-400", children: int.last_synced_at ? (0, date_fns_1.format)(new Date(int.last_synced_at), "MMM d, HH:mm") : "Never synced" })] }, int.provider))), (!org.integrations || org.integrations.length === 0) && ((0, jsx_runtime_1.jsx)("span", { className: "text-gray-400 italic text-xs", children: "No integrations" }))] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-right", children: org.integrations?.map((int) => int.is_active && ((0, jsx_runtime_1.jsxs)("form", { action: forceSync, className: "inline-block ml-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "orgId", value: org.id }), (0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "provider", value: int.provider }), (0, jsx_runtime_1.jsx)("button", { type: "submit", title: `Force sync ${int.provider}`, className: "p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 16 }) })] }, int.provider))) })] }, org.id))) })] }) }) })] }));
}
