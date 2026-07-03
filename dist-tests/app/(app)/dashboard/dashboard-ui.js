"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardUI = DashboardUI;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const types_1 = require("@/lib/types");
const date_fns_1 = require("date-fns");
const dashboard_widgets_1 = require("@/components/site/dashboard-widgets");
const currency_selector_1 = require("@/components/site/currency-selector");
function formatCurrency(value, currency = "USD") {
    return new Intl.NumberFormat(undefined, {
        currency,
        style: "currency",
        maximumFractionDigits: 0,
    }).format(Number(value));
}
function DashboardUI({ customers, events, recentEvents, recentInvoices, activeAutomations, pendingDrafts, uniqueCurrencies, selectedCurrency, }) {
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    for (const c of customers) {
        const paid = Number(c.amount_paid) || 0;
        const owed = Number(c.amount_owed) || 0;
        const remaining = Math.max(0, owed - paid);
        totalCollected += paid;
        totalOutstanding += remaining;
        const daysOverdue = (0, types_1.getDaysOverdue)(c);
        if (daysOverdue && remaining > 0 && !c.client_paid_at) {
            totalOverdue += remaining;
        }
    }
    const collectionRate = (totalCollected + totalOutstanding) > 0
        ? (totalCollected / (totalCollected + totalOutstanding)) * 100
        : 0;
    // Get top 5 overdue/outstanding customers
    const actionNeeded = customers
        .filter((c) => {
        const remaining = Math.max(0, Number(c.amount_owed) - Number(c.amount_paid));
        return remaining > 0 && !c.client_paid_at;
    })
        .sort((a, b) => {
        const aOverdue = (0, types_1.getDaysOverdue)(a) || 0;
        const bOverdue = (0, types_1.getDaysOverdue)(b) || 0;
        if (aOverdue !== bOverdue)
            return bOverdue - aOverdue; // Most overdue first
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })
        .slice(0, 5);
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8 flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl", children: "Overview" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 max-w-2xl text-base leading-7 text-zinc-500", children: "A high-level look at your receivables and collections performance." })] }), (0, jsx_runtime_1.jsx)(currency_selector_1.CurrencySelector, { currencies: uniqueCurrencies, selected: selectedCurrency })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.025] border-white/10 relative overflow-hidden group", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400", children: "Total Collected" }), (0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "h-4 w-4 text-emerald-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-zinc-50", children: formatCurrency(totalCollected, selectedCurrency) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.025] border-white/10 group relative", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400", children: "Total Outstanding" }), (0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "h-4 w-4 text-blue-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-zinc-50", children: formatCurrency(totalOutstanding, selectedCurrency) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.025] border-white/10 group relative", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400", children: "Collection Rate" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Percent, { className: "h-4 w-4 text-purple-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "text-2xl font-bold text-zinc-50", children: [collectionRate.toFixed(1), "%"] }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.025] border-white/10 group relative", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help", title: "The total amount of money from invoices that are past their due date.", children: ["Overdue Risk", (0, jsx_runtime_1.jsx)(lucide_react_1.Info, { className: "h-3.5 w-3.5 text-zinc-600" })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-4 w-4 text-red-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-zinc-50", children: formatCurrency(totalOverdue, selectedCurrency) }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-8 lg:grid-cols-[1fr_1fr] mb-8", children: [(0, jsx_runtime_1.jsx)(dashboard_widgets_1.DashboardPipelineWidget, { customers: customers, currency: selectedCurrency }), (0, jsx_runtime_1.jsx)(dashboard_widgets_1.CollectionTrendWidget, { events: events, currency: selectedCurrency })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-8 lg:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-4", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "text-xl font-semibold tracking-tight text-zinc-50 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "h-5 w-5 text-zinc-400" }), " Customers Action Needed"] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/customers", className: "text-sm font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors", children: ["View all ", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4" })] })] }), actionNeeded.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: actionNeeded.map((customer) => {
                                    const remaining = Math.max(0, Number(customer.amount_owed) - Number(customer.amount_paid));
                                    const daysOverdue = (0, types_1.getDaysOverdue)(customer);
                                    return ((0, jsx_runtime_1.jsxs)(link_1.default, { href: `/customers/${customer.id}`, className: "flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.025] hover:bg-white/[0.05] transition-colors", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-medium text-zinc-200", children: customer.recipient_name }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-500 mt-0.5", children: daysOverdue ? (0, jsx_runtime_1.jsxs)("span", { className: "text-red-400", children: [daysOverdue, " days overdue"] }) : "Outstanding" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("div", { className: "font-medium text-zinc-200", children: formatCurrency(remaining, customer.currency) }), (0, jsx_runtime_1.jsx)("div", { className: "text-sm text-zinc-500 mt-0.5", children: "Remaining" })] })] }, customer.id));
                                }) })) : ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center h-[300px] flex flex-col justify-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "mx-auto h-8 w-8 text-zinc-500 mb-3" }), (0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-medium text-zinc-200", children: "You're all caught up" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-500 mt-1", children: "No customers currently need your attention." })] }))] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-4", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "text-xl font-semibold tracking-tight text-zinc-50 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { className: "h-5 w-5 text-zinc-400" }), " Recent Activity"] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/activity", className: "text-sm font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors", children: ["View all ", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4" })] })] }), recentEvents.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: recentEvents.map((event) => {
                                    const isPayment = event.event_type === "payment";
                                    const customerName = event.clients?.name || event.invoices?.recipient_name || "Unknown Customer";
                                    return ((0, jsx_runtime_1.jsxs)(link_1.default, { href: `/customers/${event.customer_id}`, className: "flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.025] hover:bg-white/[0.05] transition-colors", children: [(0, jsx_runtime_1.jsx)("div", { className: `mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${isPayment ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-blue-500/20 bg-blue-500/10 text-blue-500"}`, children: isPayment ? (0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "h-3.5 w-3.5" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Send, { className: "h-3.5 w-3.5" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 space-y-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-zinc-200", children: isPayment ? "Payment Logged" : "Follow-up Sent" }), (0, jsx_runtime_1.jsx)("time", { className: "text-xs text-zinc-500", children: (0, date_fns_1.formatDistanceToNow)(new Date(event.created_at), { addSuffix: true }) })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-400", children: isPayment
                                                            ? `Recorded ${formatCurrency(Number(event.amount), event.currency)} from ${customerName}`
                                                            : `Sent an automated follow-up to ${customerName}` })] })] }, event.id));
                                }) })) : ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center h-[300px] flex flex-col justify-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { className: "mx-auto h-8 w-8 text-zinc-500 mb-3" }), (0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-medium text-zinc-200", children: "No recent activity" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-500 mt-1", children: "Your recent payments and follow-ups will appear here." })] }))] })] })] }));
}
