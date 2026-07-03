"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = XeroBankSelectionPage;
const jsx_runtime_1 = require("react/jsx-runtime");
/* eslint-disable */
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
const xero_node_1 = require("xero-node");
const navigation_1 = require("next/navigation");
const container_1 = require("@/components/site/container");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const logger_1 = require("@/lib/logger");
const link_1 = __importDefault(require("next/link"));
async function XeroBankSelectionPage() {
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: integration, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", user.id)
        .eq("provider", "xero")
        .maybeSingle();
    if (error || !integration) {
        (0, navigation_1.redirect)("/settings/integrations");
    }
    let bankAccounts = [];
    try {
        const xero = new xero_node_1.XeroClient();
        xero.setTokenSet({
            access_token: integration.access_token,
            refresh_token: integration.refresh_token,
            expires_at: Math.floor(new Date(integration.expires_at).getTime() / 1000),
        });
        if (new Date(integration.expires_at).getTime() - Date.now() <= 5 * 60 * 1000) {
            await xero.refreshToken();
        }
        const accountsResponse = await xero.accountingApi.getAccounts(integration.tenant_id, undefined, 'Type=="BANK"');
        bankAccounts = accountsResponse.body.accounts?.filter(a => String(a.status) === "ACTIVE") || [];
    }
    catch (e) {
        logger_1.logger.error({
            message: "Failed to fetch Xero bank accounts",
            context: "xero:bank_accounts",
            user_id: user.id,
            error: e
        });
    }
    async function selectAccount(formData) {
        "use server";
        const accountId = formData.get("account_id");
        const accountName = formData.get("account_name");
        const supabaseAction = await (0, server_1.createSupabaseServerClient)();
        await supabaseAction
            .from("integrations")
            .update({ bank_account_id: accountId, bank_account_name: accountName })
            .eq("user_id", user.id)
            .eq("provider", "xero");
        (0, navigation_1.redirect)("/settings/integrations");
    }
    return ((0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-12 max-w-2xl mx-auto", children: (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.025] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-xl", children: "Select Xero Bank Account" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Choose the bank account where Duely should record payments sent to Xero." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: bankAccounts.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "text-sm text-zinc-400 py-4", children: ["No active bank accounts found in your Xero organization. Please add one in Xero first.", (0, jsx_runtime_1.jsx)("div", { className: "mt-4", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/settings/integrations", children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "secondary", children: "Return to Integrations" }) }) })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: bankAccounts.map((account) => ((0, jsx_runtime_1.jsxs)("form", { action: selectAccount, children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "account_id", value: account.accountID }), (0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "account_name", value: account.name }), (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "secondary", className: "w-full justify-between py-6 h-auto", type: "submit", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-base", children: account.name }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-zinc-500", children: account.currencyCode })] })] }, account.accountID))) })) })] }) }));
}
