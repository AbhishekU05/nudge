"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NewCustomerPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const clients_1 = require("@/app/actions/clients");
const container_1 = require("@/components/site/container");
const badge_1 = require("@/components/ui/badge");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const auth_1 = require("@/lib/auth");
const payments_1 = require("@/lib/payments");
const pricing_1 = require("@/lib/pricing");
const server_1 = require("@/lib/supabase/server");
const utils_1 = require("@/lib/utils");
async function NewCustomerPage(props) {
    const user = await (0, auth_1.requireUser)();
    const searchParams = await props.searchParams;
    const { error } = searchParams;
    const monthlyPrice = await (0, pricing_1.getLocalizedMonthlyPrice)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: profile } = await supabase
        .from("profiles")
        .select("razorpay_subscription_status, razorpay_renews_at, created_at")
        .eq("user_id", user.id)
        .maybeSingle();
    const hasSubscription = (0, payments_1.hasActiveSubscription)(profile?.razorpay_subscription_status ?? null, profile?.created_at, profile?.razorpay_renews_at);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex min-h-screen flex-col", children: [(0, jsx_runtime_1.jsx)("header", { className: "sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "flex h-16 items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/customers", className: "inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { className: "h-4 w-4" }), "Customers"] }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: hasSubscription ? "success" : "warning", children: hasSubscription ? "Plan active" : "Billing required" })] }) }), (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-8 sm:py-10", children: (0, jsx_runtime_1.jsx)("div", { className: "mx-auto max-w-2xl gap-6", children: (0, jsx_runtime_1.jsxs)("section", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl", children: "Add customer" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 max-w-xl text-base leading-7 text-zinc-500", children: "Add a new client to your CRM. You can create invoices and set up follow-up schedules for them later." })] }), !hasSubscription && ((0, jsx_runtime_1.jsx)(card_1.Card, { className: "border-amber-500/20 bg-amber-500/10", children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "font-medium text-amber-100", children: "Billing required" }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-sm leading-6 text-amber-100/70", children: ["Activate your plan for ", monthlyPrice.inline, " to start tracking customers."] })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/settings/billing", children: (0, jsx_runtime_1.jsx)(button_1.Button, { children: "Open billing" }) })] }) })), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: (0, utils_1.cn)("bg-white/[0.035]", !hasSubscription && "opacity-60"), children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2 text-xl", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserPlus, { className: "h-5 w-5 text-primary" }), "Customer details"] }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Only the essentials." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("form", { action: clients_1.createClient, className: "grid gap-5 sm:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2 sm:col-span-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "name", children: "Customer name / Company" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "name", name: "name", placeholder: "Acme Corp", maxLength: 100, required: true, disabled: !hasSubscription })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2 sm:col-span-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "email", children: "Customer email" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "email", name: "email", type: "email", placeholder: "billing@acme.com", maxLength: 320, disabled: !hasSubscription })] }), error && ((0, jsx_runtime_1.jsx)("div", { className: "sm:col-span-2", children: (0, jsx_runtime_1.jsx)("p", { className: "rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200", role: "alert", children: error }) })), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end mt-4", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/customers", children: (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "secondary", className: "w-full sm:w-auto", children: "Cancel" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", disabled: !hasSubscription, className: "w-full sm:w-auto", children: "Create customer" })] })] }) })] })] }) }) }) })] }));
}
