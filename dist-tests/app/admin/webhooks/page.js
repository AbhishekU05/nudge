"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminWebhooks;
const jsx_runtime_1 = require("react/jsx-runtime");
const admin_1 = require("@/lib/supabase/admin");
const date_fns_1 = require("date-fns");
async function AdminWebhooks() {
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { data: webhooks, error } = await supabase
        .from("webhook_events")
        .select("*")
        .order("processed_at", { ascending: false })
        .limit(100);
    if (error) {
        return (0, jsx_runtime_1.jsxs)("div", { className: "text-red-500", children: ["Error loading webhooks: ", error.message] });
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold text-gray-900", children: "Webhook Ingestion Log" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 text-sm", children: "Displaying the last 100 webhook events processed by the system (Dodo Payments idempotency log)." }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left text-sm", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-gray-50 border-b border-gray-200 text-gray-600 font-medium", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Event ID" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Type" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Processed At" })] }) }), (0, jsx_runtime_1.jsxs)("tbody", { className: "divide-y divide-gray-200", children: [webhooks?.map((webhook) => ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50/50", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 font-mono text-xs text-gray-500", children: webhook.id }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsx)("span", { className: "bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium", children: webhook.type }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-gray-600", children: webhook.processed_at ? (0, date_fns_1.format)(new Date(webhook.processed_at), "MMM d, yyyy HH:mm:ss") : "Unknown" })] }, webhook.id))), webhooks?.length === 0 && ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 3, className: "px-6 py-8 text-center text-gray-500 italic", children: "No webhook events processed yet." }) }))] })] }) }) })] }));
}
