"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionCard = ActionCard;
exports.ActionsUI = ActionsUI;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
function formatCurrency(value, currency = "USD") {
    return new Intl.NumberFormat(undefined, {
        currency,
        style: "currency",
        maximumFractionDigits: 0,
    }).format(Number(value));
}
function ActionCard({ task }) {
    let borderClass = "";
    let bgClass = "";
    let textClass = "";
    let icon = null;
    let badgeClass = "";
    if (task.category === "critical") {
        borderClass = "border-red-500/30";
        bgClass = "bg-red-500/5 hover:bg-red-500/10";
        textClass = "text-red-400";
        badgeClass = "bg-red-500/10 text-red-400 border border-red-500/20";
        icon = (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-5 w-5 text-red-400" });
    }
    else if (task.category === "moderate") {
        borderClass = "border-amber-500/30";
        bgClass = "bg-amber-500/5 hover:bg-amber-500/10";
        textClass = "text-amber-400";
        badgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
        icon = (0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { className: "h-5 w-5 text-amber-400" });
    }
    else if (task.category === "chill") {
        borderClass = "border-emerald-500/30";
        bgClass = "bg-emerald-500/5 hover:bg-emerald-500/10";
        textClass = "text-emerald-400";
        badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
        icon = (0, jsx_runtime_1.jsx)(lucide_react_1.Coffee, { className: "h-5 w-5 text-emerald-400" });
    }
    else if (task.category === "system") {
        borderClass = "border-purple-500/30";
        bgClass = "bg-purple-500/5 hover:bg-purple-500/10";
        textClass = "text-purple-400";
        badgeClass = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
        icon = (0, jsx_runtime_1.jsx)(lucide_react_1.Info, { className: "h-5 w-5 text-purple-400" });
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: `p-6 sm:p-8 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-start gap-6 ${borderClass} ${bgClass} group`, children: [(0, jsx_runtime_1.jsx)("div", { className: `mt-1 shrink-0 p-3 rounded-full bg-black/40 ${textClass}`, children: icon }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-3", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-semibold text-zinc-50 tracking-tight", children: task.clientName }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs font-medium px-2.5 py-1 rounded-full uppercase tracking-wider ${badgeClass}`, children: task.category })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-base text-zinc-300 leading-relaxed max-w-3xl", children: task.contextText }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 flex items-center gap-3", children: task.category === "system" ? ((0, jsx_runtime_1.jsxs)(link_1.default, { href: "/automate", className: `inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border ${borderClass} bg-black/40 hover:bg-black/60 transition-colors ${textClass}`, children: ["Configure Settings ", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4" })] })) : ((0, jsx_runtime_1.jsxs)(link_1.default, { href: `/invoices/${task.primaryInvoiceId}`, className: `inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border ${borderClass} bg-black/40 hover:bg-black/60 transition-colors ${textClass}`, children: [task.recommendation === "firm_nudge" && "Send Firm Nudge", task.recommendation === "friendly_checkin" && "Send Friendly Nudge", task.recommendation === "light_nudge" && "Send Light Nudge", task.recommendation === "reply_needed" && "Reply to Client", (!["firm_nudge", "friendly_checkin", "light_nudge", "reply_needed"].includes(task.recommendation)) && "Follow up", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4" })] })) })] }), (task.totalOwed > 0 || task.maxDaysOverdue > 0) && ((0, jsx_runtime_1.jsxs)("div", { className: "w-full sm:w-auto mt-4 sm:mt-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 sm:gap-2 shrink-0 bg-black/20 sm:bg-transparent p-4 sm:p-0 rounded-xl", children: [task.totalOwed > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "text-left sm:text-right", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-sm font-medium text-zinc-400 mb-0.5", children: "At Risk" }), (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-zinc-100", children: formatCurrency(task.totalOwed, task.currency || "USD") })] })), task.maxDaysOverdue > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-sm font-medium text-zinc-400 mb-0.5", children: "Overdue" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-lg font-semibold text-red-400", children: [task.maxDaysOverdue, " Days"] })] }))] }))] }));
}
function ActionsUI({ tasks, isAllUnder3Days = false }) {
    const visibleTasks = tasks.filter(t => t.category !== "hidden");
    const noTasks = visibleTasks.length === 0;
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8", children: [(0, jsx_runtime_1.jsxs)("h1", { className: "text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "h-10 w-10 text-amber-400" }), " Action Center"] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 max-w-2xl text-base leading-7 text-zinc-500", children: "Your intelligent queue of prioritized follow-ups and account interventions." })] }), noTasks ? (isAllUnder3Days ? ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-12 text-center flex flex-col items-center justify-center min-h-[400px]", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-emerald-500/10 p-4 rounded-full mb-6", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-12 w-12 text-emerald-400" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-medium text-zinc-100 tracking-tight", children: "All caught up!" }), (0, jsx_runtime_1.jsx)("p", { className: "text-base text-zinc-400 mt-3 max-w-md", children: "We've analyzed your accounting data. Good news! You have no fires to put out today. Relax or focus on other work." })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center flex flex-col items-center justify-center min-h-[400px]", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-white/5 p-4 rounded-full mb-6", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Coffee, { className: "h-12 w-12 text-zinc-500" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-medium text-zinc-100 tracking-tight", children: "No pressing actions" }), (0, jsx_runtime_1.jsx)("p", { className: "text-base text-zinc-400 mt-3 max-w-md", children: "There are no immediate tasks right now that require your attention." })] }))) : ((0, jsx_runtime_1.jsx)("div", { className: "grid gap-4", children: visibleTasks.map((task, i) => ((0, jsx_runtime_1.jsx)(ActionCard, { task: task }, `${task.clientId}-${i}`))) }))] }));
}
