"use strict";
/* eslint-disable */
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionTrendWidget = CollectionTrendWidget;
exports.DashboardPipelineWidget = DashboardPipelineWidget;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const recharts_1 = require("recharts");
const card_1 = require("@/components/ui/card");
function CustomTooltip({ active, payload, label, currency = "USD" }) {
    if (active && payload && payload.length) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-lg border border-white/10 bg-zinc-900 p-3 shadow-xl", children: [(0, jsx_runtime_1.jsx)("p", { className: "mb-1 text-sm font-medium text-zinc-300", children: label }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-bold text-emerald-400", children: new Intl.NumberFormat(undefined, {
                        currency,
                        style: "currency",
                        maximumFractionDigits: 0,
                    }).format(Number(payload[0].value)) })] }));
    }
    return null;
}
function CollectionTrendWidget({ events, currency = "USD" }) {
    const data = (0, react_1.useMemo)(() => {
        const monthlyTotals = {};
        const now = new Date();
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            monthlyTotals[monthLabel] = 0;
        }
        events.forEach((event) => {
            if (event.event_type === "payment" && event.amount) {
                const d = new Date(event.event_date || event.created_at);
                const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                if (monthlyTotals[monthLabel] !== undefined) {
                    monthlyTotals[monthLabel] += Number(event.amount);
                }
            }
        });
        return Object.entries(monthlyTotals).map(([month, amount]) => ({
            month: month.split(" ")[0], // Only show "Jun" on the x-axis for cleanliness
            amount,
        }));
    }, [events]);
    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.025] border-white/10 h-full flex flex-col", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-zinc-100", children: "Collection Trends" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Monthly revenue collected over the last 6 months." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "flex-1 pb-6", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full min-h-[250px] w-full", children: data.some((d) => d.amount > 0) ? ((0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.AreaChart, { data: data, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [(0, jsx_runtime_1.jsx)("defs", { children: (0, jsx_runtime_1.jsxs)("linearGradient", { id: "colorAmountDashboard", x1: "0", y1: "0", x2: "0", y2: "1", children: [(0, jsx_runtime_1.jsx)("stop", { offset: "5%", stopColor: "#10b981", stopOpacity: 0.3 }), (0, jsx_runtime_1.jsx)("stop", { offset: "95%", stopColor: "#10b981", stopOpacity: 0 })] }) }), (0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10", vertical: false }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "month", stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false, tickFormatter: (v) => new Intl.NumberFormat(undefined, { currency, style: "currency", maximumFractionDigits: 0 }).format(v) }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { content: (0, jsx_runtime_1.jsx)(CustomTooltip, { currency: currency }) }), (0, jsx_runtime_1.jsx)(recharts_1.Area, { type: "monotone", dataKey: "amount", stroke: "#10b981", strokeWidth: 2, fillOpacity: 1, fill: "url(#colorAmountDashboard)" })] }) })) : ((0, jsx_runtime_1.jsx)("div", { className: "flex h-full items-center justify-center text-sm text-zinc-600", children: "No payment data available yet." })) }) })] }));
}
const types_1 = require("@/lib/types");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const COLUMNS = [
    { id: "outstanding", title: "Outstanding", color: "border-blue-500/20 bg-blue-500/10 text-blue-400" },
    { id: "overdue", title: "Overdue", color: "border-red-500/20 bg-red-500/10 text-red-400" },
    { id: "paid", title: "Paid In Full", color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
];
function formatCurrency(value, currency = "USD") {
    return new Intl.NumberFormat(undefined, {
        currency,
        style: "currency",
        maximumFractionDigits: 0,
    }).format(Number(value));
}
function DashboardPipelineWidget({ customers, currency = "USD" }) {
    const getCustomersByStatus = (status) => {
        return customers
            .filter((c) => c.workflow_status === status)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    };
    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.025] border-white/10 h-full flex flex-col", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-zinc-100", children: "Pipeline Snapshot" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Top customers by status." })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/pipeline", className: "text-sm font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors", children: ["View all ", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4" })] })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "flex-1 overflow-x-auto pb-6", children: (0, jsx_runtime_1.jsx)("div", { className: "flex gap-4 h-full min-w-[700px]", children: COLUMNS.map((column) => {
                        const colCustomers = getCustomersByStatus(column.id);
                        const colTotal = colCustomers.reduce((acc, c) => {
                            const remaining = Math.max(0, Number(c.amount_owed) - Number(c.amount_paid));
                            return acc + (column.id === 'paid' ? Number(c.amount_paid) || Number(c.amount_owed) : remaining);
                        }, 0);
                        // Only show top 3 to keep it compact
                        const displayCustomers = colCustomers.slice(0, 3);
                        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 flex-col rounded-xl bg-white/[0.015] border border-white/5", children: [(0, jsx_runtime_1.jsx)("div", { className: "p-3 border-b border-white/5 flex items-center justify-between", children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { className: "font-medium text-zinc-100 flex items-center gap-2 text-sm", children: [column.title, (0, jsx_runtime_1.jsx)("span", { className: `text-[10px] px-1.5 py-0.5 rounded-full border ${column.color}`, children: colCustomers.length })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500 mt-1", children: formatCurrency(colTotal, currency) })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "p-2 space-y-2", children: [displayCustomers.map((customer) => {
                                            const remaining = Math.max(0, Number(customer.amount_owed) - Number(customer.amount_paid));
                                            const displayAmount = column.id === 'paid' ? Number(customer.amount_paid) || Number(customer.amount_owed) : remaining;
                                            const daysOverdue = (0, types_1.getDaysOverdue)(customer);
                                            return ((0, jsx_runtime_1.jsx)(card_1.Card, { className: "bg-[#1c1c1e] border-white/10 p-3 rounded-lg shadow-sm", children: (0, jsx_runtime_1.jsxs)(link_1.default, { href: `/invoices/${customer.id}`, className: "block", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-start mb-1.5", children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-medium text-zinc-200 text-xs line-clamp-1", children: customer.recipient_name }), (0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-zinc-100 text-xs", children: formatCurrency(displayAmount, currency) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-[10px] text-zinc-500 mt-2", children: [customer.due_date && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Calendar, { className: "h-2.5 w-2.5" }), new Date(customer.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })] })), daysOverdue !== null && daysOverdue > 0 && column.id !== 'paid' && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 text-red-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-2.5 w-2.5" }), daysOverdue, "d late"] }))] })] }) }, customer.id));
                                        }), colCustomers.length > 3 && ((0, jsx_runtime_1.jsx)("div", { className: "text-center pt-1", children: (0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] text-zinc-500", children: ["+", colCustomers.length - 3, " more"] }) })), colCustomers.length === 0 && ((0, jsx_runtime_1.jsx)("div", { className: "text-center py-4 text-xs text-zinc-600", children: "Empty" }))] })] }, column.id));
                    }) }) })] }));
}
