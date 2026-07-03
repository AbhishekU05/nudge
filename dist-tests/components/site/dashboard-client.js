"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardClient = DashboardClient;
const jsx_runtime_1 = require("react/jsx-runtime");
/*
 * DashboardClient — the interactive shell for the workflow-first dashboard.
 * Manages which customer's drawer is open; all data fetching stays in the
 * server page component (dashboard/page.tsx).
 */
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const badge_1 = require("@/components/ui/badge");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const utils_1 = require("@/lib/utils");
const types_1 = require("@/lib/types");
const link_1 = __importDefault(require("next/link"));
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(value, currency = "USD") {
    return new Intl.NumberFormat(undefined, { currency, style: "currency" }).format(Number(value));
}
function getInitials(name) {
    return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}
// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, sub, accent, tooltip, }) {
    const iconColors = {
        red: "text-red-400",
        amber: "text-amber-400",
        emerald: "text-emerald-400",
        indigo: "text-indigo-400",
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-3 rounded-2xl border border-border bg-white/[0.025] p-4 relative group", children: [(0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]", accent && iconColors[accent]), children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-semibold tracking-tight text-zinc-50", children: value }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 mt-0.5", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: label }), tooltip && ((0, jsx_runtime_1.jsx)("div", { title: tooltip, className: "cursor-help flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("svg", { className: "w-3 h-3 text-zinc-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }))] }), sub && (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-zinc-500", children: sub })] })] }));
}
function CustomerCard({ customer, onOpen, }) {
    const remaining = (0, types_1.getRemainingBalance)(customer);
    const daysOverdue = (0, types_1.getDaysOverdue)(customer);
    const status = customer.workflow_status;
    const paid = (0, types_1.isEffectivelyPaid)(customer);
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("group w-full rounded-2xl border border-border bg-white/[0.025] transition-colors hover:border-white/20 hover:bg-white/[0.04]", paid && "opacity-60"), children: (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => onOpen(customer), className: "w-full p-4 text-left", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex min-w-0 items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-zinc-300", children: getInitials(customer.recipient_name) }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "truncate text-sm font-semibold text-zinc-100", children: customer.recipient_name }), paid && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: customer.client_paid_at ? "success" : "default", children: customer.client_paid_at ? "Customer marked paid" : "You marked paid" })), status === "partial" && !paid && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "default", children: "Partial" })), daysOverdue !== null && !paid && ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "danger", children: [daysOverdue, "d overdue"] })), customer.promised_date && !paid && ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "default", children: ["Promised ", new Date(customer.promised_date).toLocaleDateString()] })), status === "promised" && !customer.promised_date && !paid && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "default", children: "Promised" })), status === "written_off" && !paid && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "muted", children: "Written off" }))] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-0.5 truncate text-xs text-zinc-600", children: customer.recipient_email })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex shrink-0 items-center gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-zinc-100", children: formatCurrency(paid ? (Number(customer.amount_paid) || Number(customer.amount_owed)) : remaining, customer.currency) }), customer.amount_paid > 0 && !paid && ((0, jsx_runtime_1.jsxs)("p", { className: "mt-0.5 text-xs text-zinc-600", children: [formatCurrency(Number(customer.amount_paid), customer.currency), " paid"] })), customer.due_date && ((0, jsx_runtime_1.jsxs)("p", { className: (0, utils_1.cn)("mt-0.5 text-xs", daysOverdue ? "text-red-400" : "text-zinc-600"), children: ["Due ", new Date(customer.due_date).toLocaleDateString()] }))] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: "h-4 w-4 shrink-0 text-zinc-700 transition-colors group-hover:text-zinc-400" })] })] }), customer.amount_paid > 0 && !paid && ((0, jsx_runtime_1.jsx)("div", { className: "mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full rounded-full bg-emerald-500/70", style: {
                            width: `${Math.min(100, (Number(customer.amount_paid) / Number(customer.amount_owed)) * 100)}%`,
                        } }) }))] }) }));
}
// ---------------------------------------------------------------------------
// Pipeline section (grouped by status)
// ---------------------------------------------------------------------------
function PipelineSection({ title, customers, onOpen, defaultOpen = true, }) {
    const [open, setOpen] = (0, react_1.useState)(defaultOpen);
    if (customers.length === 0)
        return null;
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => setOpen((o) => !o), className: "mb-3 flex w-full items-center justify-between text-left", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-semibold uppercase tracking-widest text-zinc-600", children: title }), (0, jsx_runtime_1.jsx)("span", { className: "rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-zinc-400", children: customers.length })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: (0, utils_1.cn)("h-3.5 w-3.5 text-zinc-700 transition-transform", open && "rotate-90") })] }), open && ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: customers.map((c) => ((0, jsx_runtime_1.jsx)(CustomerCard, { customer: c, onOpen: onOpen }, c.id))) }))] }));
}
// ---------------------------------------------------------------------------
// Quick add customer card (sidebar)
// ---------------------------------------------------------------------------
function QuickAddCard({ hasSubscription }) {
    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.035]", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 text-primary" }), "Add customer"] }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Track a new outstanding balance." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "space-y-3", children: hasSubscription ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm leading-6 text-zinc-500", children: "Enter their details, log payments, and set up automated reminders whenever you're ready." }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/invoices/new", className: "block", children: (0, jsx_runtime_1.jsxs)(button_1.Button, { className: "w-full gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-3.5 w-3.5" }), "Add customer"] }) })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm leading-6 text-zinc-500", children: "Activate your plan to start tracking customers." }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/settings/billing", className: "block", children: (0, jsx_runtime_1.jsx)(button_1.Button, { className: "w-full", children: "Open billing" }) })] })) })] }));
}
// ---------------------------------------------------------------------------
// Recent activity feed (sidebar)
// ---------------------------------------------------------------------------
function ActivityFeed({ customers }) {
    const items = customers
        .flatMap((c) => {
        const entries = [];
        if (c.client_paid_at) {
            entries.push({
                id: `${c.id}-paid`,
                label: "Paid — customer confirmed",
                sub: c.recipient_name,
                at: c.client_paid_at,
                tone: "success",
            });
        }
        else if (c.workflow_status === "paid") {
            entries.push({
                id: `${c.id}-paid`,
                label: "Marked as paid",
                sub: c.recipient_name,
                at: c.updated_at,
                tone: "success",
            });
        }
        if (c.promised_date) {
            entries.push({
                id: `${c.id}-promised`,
                label: "Payment promised",
                sub: `${c.recipient_name} · ${new Date(c.promised_date).toLocaleDateString()}`,
                at: c.updated_at,
                tone: "primary",
            });
        }
        return entries;
    })
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 7);
    const dotColors = {
        success: "bg-emerald-400",
        warning: "bg-amber-400",
        muted: "bg-zinc-600",
        primary: "bg-primary",
    };
    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.025]", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-4 w-4 text-primary" }), "Recent activity"] }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Payments, promises, and follow-ups." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: items.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: items.map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3", children: [(0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", dotColors[item.tone]) }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-zinc-200", children: item.label }), (0, jsx_runtime_1.jsx)("p", { className: "mt-0.5 truncate text-sm text-zinc-500", children: item.sub })] })] }, item.id))) })) : ((0, jsx_runtime_1.jsx)("div", { className: "rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center text-sm text-zinc-600", children: "Activity will appear here as you log payments and follow-ups." })) })] }));
}
// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
function DashboardClient({ customers, hasSubscription, isDevelopment, currency = "USD", }) {
    const [selectedCustomer, setSelectedCustomer] = (0, react_1.useState)(null);
    const [activeTab, setActiveTab] = (0, react_1.useState)("payment");
    const router = (0, navigation_1.useRouter)();
    function handleOpen(customer, tab = "payment") {
        router.push(`/invoices/${customer.id}?tab=${tab}`);
    }
    // Pipeline groupings — simplified: overdue / outstanding / paid / opted out
    const overdue = customers.filter((c) => (0, types_1.getDaysOverdue)(c) !== null && !(0, types_1.isEffectivelyPaid)(c));
    const outstanding = customers.filter((c) => !(0, types_1.isEffectivelyPaid)(c) && (0, types_1.getDaysOverdue)(c) === null);
    const paid = customers.filter((c) => (0, types_1.isEffectivelyPaid)(c));
    const optedOut = [];
    // Stats
    const totalOutstanding = customers
        .filter((c) => !(0, types_1.isEffectivelyPaid)(c) && c.workflow_status !== "written_off")
        .reduce((sum, c) => sum + (0, types_1.getRemainingBalance)(c), 0);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4", children: [(0, jsx_runtime_1.jsx)(StatCard, { icon: lucide_react_1.DollarSign, label: "Total outstanding", value: customers.length > 0 ? formatCurrency(totalOutstanding, currency) : "—", accent: "indigo" }), (0, jsx_runtime_1.jsx)(StatCard, { icon: lucide_react_1.AlertTriangle, label: "Overdue", value: String(overdue.length), sub: overdue.length > 0 ? "Need attention" : "All on track", accent: "red" }), (0, jsx_runtime_1.jsx)(StatCard, { icon: lucide_react_1.CheckCircle2, label: "Paid", value: String(paid.length), accent: "emerald" }), (0, jsx_runtime_1.jsx)(StatCard, { icon: lucide_react_1.Users, label: "Opted out", value: String(optedOut.length), sub: optedOut.length > 0 ? "Unsubscribed" : undefined, accent: "amber" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-5", children: (0, jsx_runtime_1.jsx)("section", { children: customers.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-500", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "mt-5 text-base font-semibold text-zinc-50", children: "No customers yet" }), (0, jsx_runtime_1.jsx)("p", { className: "mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500", children: "Add a customer to start tracking what they owe. You can log payments, record promises, and draft follow-ups from one place." }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: hasSubscription ? "/invoices/new" : "/settings/billing", children: (0, jsx_runtime_1.jsx)(button_1.Button, { children: hasSubscription ? "Add your first customer" : "Activate billing" }) }) })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)(PipelineSection, { title: "Overdue", customers: overdue, onOpen: handleOpen }), (0, jsx_runtime_1.jsx)(PipelineSection, { title: "Outstanding", customers: outstanding, onOpen: handleOpen }), (0, jsx_runtime_1.jsx)(PipelineSection, { title: "Paid", customers: paid, onOpen: handleOpen, defaultOpen: false }), optedOut.length > 0 && ((0, jsx_runtime_1.jsx)(PipelineSection, { title: "Opted out", customers: optedOut, onOpen: handleOpen, defaultOpen: false }))] })) }) })] }));
}
