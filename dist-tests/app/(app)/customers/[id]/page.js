"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CustomerProfilePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const container_1 = require("@/components/site/container");
const automation_settings_1 = require("@/components/site/automation-settings");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
const types_1 = require("@/lib/types");
const customer_analytics_1 = require("./customer-analytics");
async function CustomerProfilePage(props) {
    const user = await (0, auth_1.requireUser)();
    const { id } = await props.params;
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (!client) {
        (0, navigation_1.notFound)();
    }
    const { data: invoices } = await supabase
        .from("invoices")
        .select("*")
        .eq("customer_id", id)
        .returns();
    const invoicesList = invoices || [];
    // Fetch the assigned group if any
    const { data: customerGroupData } = await supabase
        .from("customer_groups")
        .select("groups(*)")
        .eq("customer_id", id)
        .maybeSingle();
    const group = customerGroupData?.groups;
    const { isAutomationAndIntegrationAllowed } = await Promise.resolve().then(() => __importStar(require("@/lib/payments")));
    const { data: org } = await supabase
        .from("organizations")
        .select("dodo_subscription_status, created_at")
        .eq("id", client.organization_id)
        .single();
    const isAllowed = org ? isAutomationAndIntegrationAllowed(org.dodo_subscription_status, org.created_at) : false;
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex min-h-screen flex-col", children: (0, jsx_runtime_1.jsx)("main", { className: "flex-1", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-8 sm:py-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", size: "sm", className: "mb-4 -ml-3 text-zinc-400 hover:text-zinc-100", children: (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/customers", className: "flex items-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { className: "mr-2 h-4 w-4" }), "Back to customers"] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-semibold tracking-[-0.04em] text-zinc-50", children: client.name }), group && ((0, jsx_runtime_1.jsx)("span", { className: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border", style: {
                                                    backgroundColor: `${group.color || "#3b82f6"}20`,
                                                    color: group.color || "#3b82f6",
                                                    borderColor: `${group.color || "#3b82f6"}40`,
                                                }, children: group.name }))] }), client.email && (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-zinc-400", children: client.email })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: `/portal/${client.unsubscribe_token}`, target: "_blank", className: "inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 font-medium tracking-tight transition-colors focus-visible:outline-none h-10 px-4 text-sm bg-white/[0.06] text-zinc-100 hover:bg-white/[0.1] sm:self-end", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ExternalLink, { className: "h-4 w-4" }), "View Client Portal"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-12", children: [(0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-medium text-zinc-100 mb-6", children: "Analytics" }), (0, jsx_runtime_1.jsx)(customer_analytics_1.CustomerAnalytics, { invoices: invoicesList })] }), (0, jsx_runtime_1.jsx)("section", { children: (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-zinc-900/50 p-6", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-medium text-zinc-100 mb-4", children: "Invoices" }), (0, jsx_runtime_1.jsx)("div", { className: "overflow-hidden rounded-xl border border-white/10", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left text-sm text-zinc-400", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-white/[0.02] border-b border-white/10", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 font-medium text-zinc-300", children: "Invoice #" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 font-medium text-zinc-300", children: "Status" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 font-medium text-zinc-300", children: "Due Date" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 font-medium text-zinc-300 text-right", children: "Amount" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-white/10", children: invoicesList.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 4, className: "p-4 text-center text-zinc-500", children: "No invoices attached." }) })) : (invoicesList.map(inv => {
                                                            const remaining = (0, types_1.getRemainingBalance)(inv);
                                                            const isPaid = inv.workflow_status === "paid" || remaining === 0;
                                                            const dueDate = inv.due_date ? new Date(inv.due_date) : null;
                                                            const isOverdue = !isPaid && dueDate && dueDate < new Date();
                                                            return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-white/[0.02]", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 font-medium text-zinc-200", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: `/invoices/${inv.id}`, className: "hover:underline hover:text-indigo-400", children: inv.invoice_number || inv.id.substring(0, 8) }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3", children: isPaid ? ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "success", children: "Paid" })) : isOverdue ? ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "danger", children: "Overdue" })) : ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "default", children: "Outstanding" })) }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3", children: dueDate ? dueDate.toLocaleDateString() : "N/A" }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 text-right text-zinc-200", children: new Intl.NumberFormat(undefined, { style: "currency", currency: inv.currency || "USD" }).format(inv.amount_owed) })] }, inv.id));
                                                        })) })] }) })] }) }), (0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-medium text-zinc-100 mb-6", children: "Automation Settings" }), (0, jsx_runtime_1.jsx)(automation_settings_1.AutomationSettings, { entityType: "client", entityId: client.id, active: client.active, autoApprove: client.auto_approve, reminderType: client.reminder_type, reminderTemplates: client.reminder_templates || [], targetEmail: client.email, isAllowed: isAllowed })] })] })] }) }) }));
}
