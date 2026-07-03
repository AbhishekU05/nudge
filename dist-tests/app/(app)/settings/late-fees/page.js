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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LateFeesSettingsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
const late_fee_manager_1 = require("./late-fee-manager");
async function LateFeesSettingsPage() {
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const [policiesResponse, groupsResponse] = await Promise.all([
        supabase
            .from("late_fee_policies")
            .select("*")
            .order("created_at", { ascending: false }),
        supabase
            .from("groups")
            .select("*")
            .order("name", { ascending: true })
    ]);
    const policies = (policiesResponse.data || []);
    const groups = (groupsResponse.data || []);
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
        return ((0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-4xl space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-semibold text-zinc-50", children: "Late Fee Policies" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-zinc-400", children: "Automatically apply fees to overdue invoices based on your custom rules." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-medium text-rose-400 mb-2", children: "Feature Locked" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-300 mb-4", children: "Upgrade to a paid subscription to automate late fees and ensure you get paid what you're owed." }), (0, jsx_runtime_1.jsx)("a", { href: "/settings/billing", className: "inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600", children: "Upgrade Plan" })] })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-4xl space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-semibold text-zinc-50", children: "Late Fee Policies" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-zinc-400", children: "Automatically apply fees to overdue invoices based on your custom rules." })] }), (0, jsx_runtime_1.jsx)(late_fee_manager_1.LateFeeManager, { initialPolicies: policies, groups: groups })] }));
}
