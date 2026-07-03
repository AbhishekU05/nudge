"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineClient = PipelineClient;
const jsx_runtime_1 = require("react/jsx-runtime");
const types_1 = require("@/lib/types");
const card_1 = require("@/components/ui/card");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
function formatCurrency(value, currency = "USD") {
    return new Intl.NumberFormat(undefined, {
        currency,
        style: "currency",
        maximumFractionDigits: 0,
    }).format(Number(value));
}
const COLUMNS = [
    { id: "outstanding", title: "Outstanding", color: "border-blue-500/20 bg-blue-500/10 text-blue-400" },
    { id: "overdue", title: "Overdue", color: "border-red-500/20 bg-red-500/10 text-red-400" },
    { id: "paid", title: "Paid In Full", color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
];
function PipelineClient({ initialCustomers, currency = "USD" }) {
    const getCustomersByStatus = (status) => {
        return initialCustomers
            .filter((c) => {
            if (c.workflow_status === "paid" || c.workflow_status === "written_off") {
                return status === c.workflow_status;
            }
            const isOverdue = (0, types_1.getDaysOverdue)(c) !== null;
            if (status === "overdue")
                return isOverdue;
            if (status === "outstanding")
                return !isOverdue;
            return false;
        })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex h-full justify-center gap-6 overflow-x-auto pb-4", children: COLUMNS.map((column) => {
            const colCustomers = getCustomersByStatus(column.id);
            const colTotal = colCustomers.reduce((acc, c) => {
                const remaining = Math.max(0, Number(c.amount_owed) - Number(c.amount_paid));
                return acc + (column.id === 'paid' ? Number(c.amount_paid) || Number(c.amount_owed) : remaining);
            }, 0);
            return ((0, jsx_runtime_1.jsxs)("div", { className: "flex min-w-[320px] max-w-[320px] flex-col rounded-xl bg-white/[0.015] border border-white/5", children: [(0, jsx_runtime_1.jsx)("div", { className: "p-4 border-b border-white/5 flex items-center justify-between", children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { className: "font-medium text-zinc-100 flex items-center gap-2", children: [column.title, (0, jsx_runtime_1.jsx)("span", { className: `text-xs px-2 py-0.5 rounded-full border ${column.color}`, children: colCustomers.length })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500 mt-1", children: formatCurrency(colTotal, currency) })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 p-3 min-h-[500px]", children: colCustomers.map((customer) => {
                            const remaining = Math.max(0, Number(customer.amount_owed) - Number(customer.amount_paid));
                            const displayAmount = column.id === 'paid' ? Number(customer.amount_paid) || Number(customer.amount_owed) : remaining;
                            const daysOverdue = (0, types_1.getDaysOverdue)(customer);
                            return ((0, jsx_runtime_1.jsx)("div", { className: "mb-3 last:mb-0 transition-shadow shadow-sm hover:border-white/20", children: (0, jsx_runtime_1.jsx)(card_1.Card, { className: "bg-[#1c1c1e] border-white/10 p-4 rounded-lg", children: (0, jsx_runtime_1.jsxs)(link_1.default, { href: `/customers/${customer.id}`, className: "block group", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-2", children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors line-clamp-1", children: customer.recipient_name }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-zinc-100 whitespace-nowrap", children: formatCurrency(displayAmount, currency) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4 text-xs text-zinc-500 mt-3", children: [customer.due_date && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Calendar, { className: "h-3 w-3" }), new Date(customer.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })] })), daysOverdue !== null && daysOverdue > 0 && column.id !== 'paid' && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 text-red-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-3 w-3" }), daysOverdue, "d late"] }))] })] }) }) }, customer.id));
                        }) })] }, column.id));
        }) }));
}
