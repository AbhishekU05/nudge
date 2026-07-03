"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeroDashboard = HeroDashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const CLIENTS = [
    {
        initials: "SO",
        name: "Sarah Okafor",
        email: "sarah@clientco.com",
        amount: "$2,400",
        due: "May 10",
        status: "overdue",
        daysOverdue: 15,
    },
    {
        initials: "DA",
        name: "David Anand",
        email: "david@acmecorp.com",
        amount: "$4,200",
        due: "May 30",
        status: "promised",
        promisedDate: "May 30",
    },
    {
        initials: "MR",
        name: "Marcus Reid",
        email: "marcus@reidstudio.io",
        amount: "$1,800",
        amountPaid: "$600 paid",
        due: "May 20",
        status: "partial",
        paidPct: 33,
    },
    {
        initials: "PL",
        name: "Priya Lal",
        email: "priya@brightleaf.co",
        amount: "$950",
        due: "May 5",
        status: "paid",
    },
];
const STATUS_CONFIG = {
    overdue: {
        badge: (d) => `${d}d overdue`,
        badgeClass: "border-red-500/30 bg-red-500/10 text-red-300",
        icon: lucide_react_1.AlertTriangle,
        iconClass: "text-red-400",
    },
    promised: {
        badge: (d, p) => `Promised ${p}`,
        badgeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
        icon: lucide_react_1.Clock,
        iconClass: "text-indigo-400",
    },
    partial: {
        badge: () => "Partial",
        badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-300",
        icon: lucide_react_1.Zap,
        iconClass: "text-blue-400",
    },
    paid: {
        badge: () => "Paid",
        badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        icon: lucide_react_1.CheckCircle2,
        iconClass: "text-emerald-400",
    },
};
// Pulse dot for active row
function PulseDot({ color }) {
    return ((0, jsx_runtime_1.jsxs)("span", { className: "relative flex h-2 w-2", children: [(0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", color) }), (0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)("relative inline-flex h-2 w-2 rounded-full", color) })] }));
}
function ClientCard({ client, active }) {
    const cfg = STATUS_CONFIG[client.status];
    const Icon = cfg.icon;
    const isPaid = client.status === "paid";
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, utils_1.cn)("group rounded-2xl border transition-all duration-500", active
            ? "border-white/20 bg-white/[0.05] shadow-lg shadow-indigo-500/5"
            : "border-white/[0.06] bg-white/[0.02]", isPaid && "opacity-50"), children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-3 px-4 py-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex min-w-0 items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xs font-semibold text-zinc-300", children: client.initials }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-sm font-semibold text-zinc-100", children: client.name }), active && !isPaid && ((0, jsx_runtime_1.jsx)(PulseDot, { color: client.status === "overdue" ? "bg-red-400" : client.status === "promised" ? "bg-indigo-400" : "bg-blue-400" })), (0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)("rounded-full border px-2 py-0.5 text-[10px] font-medium", cfg.badgeClass), children: client.status === "overdue"
                                                    ? cfg.badge(client.daysOverdue)
                                                    : client.status === "promised"
                                                        ? cfg.badge(undefined, client.promisedDate)
                                                        : cfg.badge() })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-0.5 truncate text-xs text-zinc-600", children: client.email })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex shrink-0 items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-zinc-100", children: client.amount }), client.amountPaid && ((0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: client.amountPaid })), client.due && !isPaid && ((0, jsx_runtime_1.jsxs)("p", { className: (0, utils_1.cn)("text-xs", client.status === "overdue" ? "text-red-400" : "text-zinc-600"), children: ["Due ", client.due] }))] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: (0, utils_1.cn)("h-4 w-4 shrink-0 transition-colors", active ? "text-zinc-400" : "text-zinc-700") })] })] }), client.status === "partial" && client.paidPct !== undefined && ((0, jsx_runtime_1.jsx)("div", { className: "px-4 pb-3", children: (0, jsx_runtime_1.jsx)("div", { className: "h-1 w-full overflow-hidden rounded-full bg-white/[0.06]", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full rounded-full bg-emerald-500/70 transition-all duration-1000", style: { width: `${client.paidPct}%` } }) }) })), active && !isPaid && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 border-t border-white/[0.04] px-4 py-1.5", children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "h-3 w-3" }), "Follow up"] }), (0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "h-3 w-3" }), "Automate"] })] }))] }));
}
function HeroDashboard() {
    const [activeIndex, setActiveIndex] = (0, react_1.useState)(0);
    // Cycle highlight through rows
    (0, react_1.useEffect)(() => {
        const interval = setInterval(() => {
            setActiveIndex((i) => (i + 1) % CLIENTS.length);
        }, 2200);
        return () => clearInterval(interval);
    }, []);
    const totalOutstanding = "$8,450";
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-2xl shadow-black/60 backdrop-blur-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-4 flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-widest text-zinc-600", children: "Collections" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-0.5 text-2xl font-semibold tracking-tight text-zinc-50", children: totalOutstanding }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: "outstanding across 3 clients" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { className: "h-3.5 w-3.5 text-red-400" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm font-semibold text-zinc-100", children: "1" }), (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] text-zinc-600", children: "Overdue" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center rounded-xl border border-border bg-white/[0.025] px-3 py-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-3.5 w-3.5 text-emerald-400" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm font-semibold text-zinc-100", children: "1" }), (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] text-zinc-600", children: "Paid" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-2 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-semibold uppercase tracking-widest text-zinc-600", children: "Outstanding" }), (0, jsx_runtime_1.jsx)("span", { className: "rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-zinc-500", children: "3" })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: CLIENTS.map((client, i) => ((0, jsx_runtime_1.jsx)(ClientCard, { client: client, active: i === activeIndex }, client.name))) })] }));
}
