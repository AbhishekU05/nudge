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
exports.default = IntegrationsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const integrations_1 = require("@/app/actions/integrations");
const badge_1 = require("@/components/ui/badge");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const auth_1 = require("@/lib/auth");
const admin_1 = require("@/lib/supabase/admin");
const server_1 = require("@/lib/supabase/server");
function Notice({ children, variant, }) {
    return ((0, jsx_runtime_1.jsx)("p", { className: variant === "success"
            ? "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
            : "rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200", role: variant === "error" ? "alert" : undefined, children: children }));
}
function formatDate(value) {
    if (!value)
        return "Not synced yet";
    return new Date(value).toLocaleString(undefined, {
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        year: "numeric",
    });
}
async function IntegrationsPage({ searchParams, }) {
    const user = await (0, auth_1.requireUser)();
    const { error, success } = await searchParams;
    const supabase = await (0, server_1.createSupabaseServerClient)();
    // Fetch Gmail connection status from profiles table
    const adminSupabase = (0, admin_1.createSupabaseAdminClient)();
    const { data: gmailProfile } = await adminSupabase
        .from("profiles")
        .select("google_access_token, google_refresh_token, gmail_connected_email")
        .eq("user_id", user.id)
        .maybeSingle();
    const isGmailConnected = Boolean(gmailProfile?.google_access_token || gmailProfile?.google_refresh_token);
    const gmailEmail = gmailProfile?.gmail_connected_email ?? null;
    // Find org id
    const { data: member } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).single();
    const orgId = member?.organization_id;
    // Paywall check
    const { isAutomationAndIntegrationAllowed } = await Promise.resolve().then(() => __importStar(require("@/lib/payments")));
    let isAllowed = true;
    if (orgId) {
        const { data: org } = await supabase.from("organizations").select("dodo_subscription_status, created_at").eq("id", orgId).single();
        if (org) {
            isAllowed = isAutomationAndIntegrationAllowed(org.dodo_subscription_status, org.created_at);
        }
    }
    const { data: xero } = await supabase
        .from("integrations")
        .select("tenant_id,last_synced_at,expires_at")
        .eq("organization_id", orgId)
        .eq("provider", "xero")
        .maybeSingle();
    const { data: quickbooks } = await supabase
        .from("integrations")
        .select("realm_id,last_synced_at,expires_at")
        .eq("organization_id", orgId)
        .eq("provider", "quickbooks")
        .maybeSingle();
    const isConnectedXero = Boolean(xero);
    const isConnectedQuickBooks = Boolean(quickbooks);
    const hasAccountingIntegration = isConnectedXero || isConnectedQuickBooks;
    if (!isAllowed) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-4xl space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-semibold text-zinc-50", children: "Integrations" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-zinc-400", children: "Connect to external services." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-medium text-rose-400 mb-2", children: "Feature Locked" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-300 mb-4", children: "Upgrade to a paid subscription to connect integrations such as Xero, QuickBooks, and Gmail." }), (0, jsx_runtime_1.jsx)("a", { href: "/settings/billing", className: "inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600", children: "Upgrade Plan" })] })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-4xl space-y-6", children: [(success || error) && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [success && (0, jsx_runtime_1.jsx)(Notice, { variant: "success", children: success }), error && (0, jsx_runtime_1.jsx)(Notice, { variant: "error", children: error })] })), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "overflow-hidden border-white/10 bg-white/[0.035]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { className: "border-b border-white/10", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2 text-2xl", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-5 w-5 text-primary" }), "Gmail"] }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { className: "mt-2 max-w-xl", children: "Send reminder emails from your own Gmail address. If not connected, reminders send from reminders@duely.in." })] }), isGmailConnected ? ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "success", className: "gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-3.5 w-3.5" }), "Connected"] })) : ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "muted", children: "Not connected" }))] }) }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "space-y-6 p-6", children: isGmailConnected ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid gap-3 sm:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: "Status" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm font-semibold text-emerald-400", children: "Sending from your Gmail" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: "Connected account" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 truncate text-sm font-semibold text-zinc-100", children: gmailEmail ?? "Gmail account" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-4", children: (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-zinc-400", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium text-zinc-200", children: "Connected:" }), " ", "Reminders send from your Gmail address. Clients see emails directly from you."] }) }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-3 sm:flex-row", children: (0, jsx_runtime_1.jsx)("form", { action: integrations_1.disconnectGmail, children: (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", variant: "secondary", className: "w-full text-red-400 hover:text-red-300 sm:w-auto", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Unplug, { className: "h-3.5 w-3.5" }), "Disconnect Gmail"] }) }) })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-4", children: (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-zinc-400", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium text-zinc-200", children: "Not connected:" }), " ", "Reminders send from", " ", (0, jsx_runtime_1.jsx)("span", { className: "font-mono text-xs text-zinc-300", children: "reminders@duely.in" }), " ", "with your name displayed as the sender."] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-zinc-200", children: "Connect your Gmail account" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 max-w-xl text-sm leading-6 text-zinc-500", children: "Duely will only request permission to send emails on your behalf. We never read your inbox." })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/api/integrations/gmail/connect", children: (0, jsx_runtime_1.jsx)(button_1.Button, { className: "w-full sm:w-auto", children: "Connect Gmail" }) })] })] })) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "overflow-hidden border-white/10 bg-white/[0.035]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { className: "border-b border-white/10", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2 text-2xl", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.PlugZap, { className: "h-5 w-5 text-primary" }), "Xero"] }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { className: "mt-2 max-w-xl", children: "Import outstanding invoices and keep Duely payment status aligned with Xero." })] }), isConnectedXero ? ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "success", className: "gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-3.5 w-3.5" }), "Connected to Xero"] })) : ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "muted", children: "Not connected" }))] }) }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "space-y-6 p-6", children: isConnectedXero ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid gap-3 sm:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: "Last synced" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm font-semibold text-zinc-100", children: formatDate(xero?.last_synced_at ?? null) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: "Tenant ID" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 truncate font-mono text-xs text-zinc-300", children: xero?.tenant_id })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: "Dual Sync Bank Account" }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2 flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("p", { className: "truncate text-sm font-semibold text-zinc-100", children: xero?.bank_account_name ? xero.bank_account_name : "Not configured (Dual sync disabled)" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/settings/integrations/xero/bank", children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "secondary", size: "sm", children: xero?.bank_account_id ? "Change" : "Setup" }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-3 sm:flex-row", children: [(0, jsx_runtime_1.jsx)("form", { action: integrations_1.syncXeroNow, children: (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", className: "w-full sm:w-auto", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "h-3.5 w-3.5" }), "Sync now"] }) }), (0, jsx_runtime_1.jsx)("form", { action: integrations_1.disconnectXero, children: (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", variant: "secondary", className: "w-full text-red-400 hover:text-red-300 sm:w-auto", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Unplug, { className: "h-3.5 w-3.5" }), "Disconnect"] }) })] })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-zinc-200", children: "Connect your Xero organisation" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 max-w-xl text-sm leading-6 text-zinc-500", children: "Duely will request read-only invoice access plus offline access so scheduled syncs can refresh tokens without changing your login flow." })] }), hasAccountingIntegration ? ((0, jsx_runtime_1.jsx)(button_1.Button, { className: "w-full sm:w-auto", disabled: true, children: "Connect Xero" })) : ((0, jsx_runtime_1.jsx)(link_1.default, { href: "/api/integrations/xero/connect", children: (0, jsx_runtime_1.jsx)(button_1.Button, { className: "w-full sm:w-auto", children: "Connect Xero" }) }))] })) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "overflow-hidden border-white/10 bg-white/[0.035]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { className: "border-b border-white/10", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2 text-2xl", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.PlugZap, { className: "h-5 w-5 text-primary" }), "QuickBooks"] }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { className: "mt-2 max-w-xl", children: "Import outstanding invoices and keep Duely payment status aligned with QuickBooks Online." })] }), isConnectedQuickBooks ? ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "success", className: "gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-3.5 w-3.5" }), "Connected to QuickBooks"] })) : ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "muted", children: "Not connected" }))] }) }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "space-y-6 p-6", children: isConnectedQuickBooks ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid gap-3 sm:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: "Last synced" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm font-semibold text-zinc-100", children: formatDate(quickbooks?.last_synced_at ?? null) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: "Company ID (Realm)" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 truncate font-mono text-xs text-zinc-300", children: quickbooks?.realm_id })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-3 sm:flex-row", children: [(0, jsx_runtime_1.jsx)("form", { action: integrations_1.syncQuickBooksNow, children: (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", className: "w-full sm:w-auto", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "h-3.5 w-3.5" }), "Sync now"] }) }), (0, jsx_runtime_1.jsx)("form", { action: integrations_1.disconnectQuickBooks, children: (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", variant: "secondary", className: "w-full text-red-400 hover:text-red-300 sm:w-auto", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Unplug, { className: "h-3.5 w-3.5" }), "Disconnect"] }) })] })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-zinc-200", children: "Connect your QuickBooks company" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 max-w-xl text-sm leading-6 text-zinc-500", children: "Duely will request read-only invoice access to keep your payment status aligned automatically." })] }), hasAccountingIntegration ? ((0, jsx_runtime_1.jsx)(button_1.Button, { className: "w-full sm:w-auto", disabled: true, children: "Connect QuickBooks" })) : ((0, jsx_runtime_1.jsx)(link_1.default, { href: "/api/integrations/quickbooks/connect", children: (0, jsx_runtime_1.jsx)(button_1.Button, { className: "w-full sm:w-auto", children: "Connect QuickBooks" }) }))] })) })] })] }));
}
