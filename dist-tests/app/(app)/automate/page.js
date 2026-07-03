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
exports.metadata = void 0;
exports.default = AutomatePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
const container_1 = require("@/components/site/container");
const badge_1 = require("@/components/ui/badge");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const local_time_1 = require("@/components/site/local-time");
const draft_list_1 = require("@/components/site/draft-list");
exports.metadata = {
    title: "Automate | Duely",
};
async function AutomatePage() {
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    // Fetch drafts
    const { data: drafts } = await supabase
        .from("email_drafts")
        .select("*, clients(name, email)")
        .eq("status", "draft")
        .order("created_at", { ascending: false });
    // Fetch active clients
    const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name, email, reminder_type, reminder_frequency_days, next_send_at, auto_approve, active, sequence_index")
        .eq("active", true)
        .order("next_send_at", { ascending: true });
    // Fetch active invoices
    const { data: invoicesData } = await supabase
        .from("invoices")
        .select("id, recipient_name, recipient_email, invoice_number, reminder_type, reminder_frequency_days, next_send_at, auto_approve, active, sequence_index")
        .eq("active", true)
        .order("next_send_at", { ascending: true });
    const clients = clientsData || [];
    const invoices = invoicesData || [];
    const totalAutomations = clients.length + invoices.length;
    const draftList = drafts || [];
    const { isAutomationAndIntegrationAllowed } = await Promise.resolve().then(() => __importStar(require("@/lib/payments")));
    let isAllowed = true;
    const { data: member } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).single();
    if (member) {
        const { data: org } = await supabase.from("organizations").select("dodo_subscription_status, created_at").eq("id", member.organization_id).single();
        if (org) {
            isAllowed = isAutomationAndIntegrationAllowed(org.dodo_subscription_status, org.created_at);
        }
    }
    if (!isAllowed) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "flex min-h-screen flex-col items-center justify-center", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-8 sm:py-10 max-w-lg text-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "h-12 w-12 text-zinc-500 mx-auto mb-4" }), (0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold tracking-tight text-zinc-50 mb-2", children: "Automations Disabled" }), (0, jsx_runtime_1.jsx)("p", { className: "text-zinc-400 mb-6", children: "You must upgrade to a paid subscription to use automated payment reminders." }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/settings/billing", className: "inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors", children: "Upgrade Plan" })] }) }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex min-h-screen flex-col", children: (0, jsx_runtime_1.jsx)("main", { className: "flex-1", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-8 sm:py-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-12", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold tracking-tight text-zinc-50", children: "Queue" }), (0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "muted", className: "bg-white/5 hover:bg-white/10", children: [draftList.length, " waiting"] })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-zinc-400 max-w-xl mb-6", children: "Review and approve automated emails before they are sent." }), (0, jsx_runtime_1.jsx)(draft_list_1.DraftList, { initialDrafts: draftList })] }), (0, jsx_runtime_1.jsxs)("div", { className: "pt-8 border-t border-white/10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 mb-8", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold tracking-tight text-zinc-50", children: "Active Automations" }), (0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "muted", className: "bg-white/5 hover:bg-white/10", children: [totalAutomations, " running"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-4", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "h-5 w-5 text-rose-400" }), (0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold text-zinc-100", children: "Statement Automations" }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "muted", className: "ml-2", children: clients.length })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: clients.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center", children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-500", children: "No active statement automations." }) })) : (clients.map(client => ((0, jsx_runtime_1.jsxs)(link_1.default, { href: `/customers/${client.id}`, className: "block rounded-xl border border-white/10 bg-zinc-900/50 p-4 transition-colors hover:bg-white/[0.02] hover:border-white/20", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-start mb-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium text-zinc-200", children: client.name }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: client.auto_approve ? "success" : "muted", children: client.auto_approve ? "Auto" : "Manual Review" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-2 mt-3 text-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 text-zinc-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "h-3 w-3 text-amber-500/70" }), (0, jsx_runtime_1.jsx)("span", { className: "capitalize", children: client.reminder_type })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 text-zinc-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-3 w-3 text-sky-500/70" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Next: ", (0, jsx_runtime_1.jsx)(local_time_1.LocalTime, { value: client.next_send_at, fallback: "N/A" })] })] })] })] }, client.id)))) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-4", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Receipt, { className: "h-5 w-5 text-purple-400" }), (0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold text-zinc-100", children: "Invoice Automations" }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "muted", className: "ml-2", children: invoices.length })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: invoices.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center", children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-500", children: "No active invoice automations." }) })) : (invoices.map(invoice => ((0, jsx_runtime_1.jsxs)(link_1.default, { href: `/invoices/${invoice.id}`, className: "block rounded-xl border border-white/10 bg-zinc-900/50 p-4 transition-colors hover:bg-white/[0.02] hover:border-white/20", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-start mb-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium text-zinc-200", children: invoice.recipient_name }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500 mt-0.5", children: invoice.invoice_number || 'Invoice' })] }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: invoice.auto_approve ? "success" : "muted", children: invoice.auto_approve ? "Auto" : "Manual Review" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-2 mt-3 text-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 text-zinc-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "h-3 w-3 text-amber-500/70" }), (0, jsx_runtime_1.jsx)("span", { className: "capitalize", children: invoice.reminder_type })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 text-zinc-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-3 w-3 text-sky-500/70" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Next: ", (0, jsx_runtime_1.jsx)(local_time_1.LocalTime, { value: invoice.next_send_at, fallback: "N/A" })] })] })] })] }, invoice.id)))) })] })] })] })] }) }) }));
}
