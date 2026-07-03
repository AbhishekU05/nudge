"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeroActionCenter = HeroActionCenter;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const ACTIONS = [
    {
        id: "a1",
        type: "critical",
        headline: "Follow up on broken promise",
        clientName: "Acme Corp",
        amount: "$15,400",
        context: "Acme Corp promised to pay by Friday, but no payment was received. They are now 18 days late.",
        primaryAction: "Send Firm Follow-up",
    },
    {
        id: "a2",
        type: "critical",
        headline: "Escalate to Final Warning",
        clientName: "Globex Inc",
        amount: "$8,200",
        context: "The 3-email sequence finished yesterday with no response. They are now 32 days overdue.",
        primaryAction: "Pause Services Warning",
    },
    {
        id: "a3",
        type: "system",
        headline: "Automate early reminders",
        clientName: "5 Clients",
        amount: "$4,200",
        context: "You have 5 clients sitting in the 1-3 days late bucket. Turn on 'Global Gentle Reminders' to handle these.",
        primaryAction: "Enable Automation",
    },
    {
        id: "a4",
        type: "moderate",
        headline: "Send a friendly check-in",
        clientName: "Initech LLC",
        amount: "$2,150",
        context: "Initech LLC is 14 days overdue. There are no broken promises, but the invoice is getting stale.",
        primaryAction: "Friendly Check-in",
    },
    {
        id: "a5",
        type: "chill",
        headline: "Send a light nudge",
        clientName: "Stark Industries",
        amount: "$12,000",
        context: "Only 2 days late. Good payer (averages 1 day overdue). They probably just forgot.",
        primaryAction: "Light Nudge",
    },
];
const STYLES = {
    critical: {
        border: "border-red-500/30",
        bg: "bg-red-500/5",
        badgeBg: "bg-red-500/20 text-red-400 border border-red-500/30",
        icon: lucide_react_1.AlertTriangle,
        iconColor: "text-red-400",
        btnColor: "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20",
    },
    system: {
        border: "border-purple-500/30",
        bg: "bg-purple-500/5",
        badgeBg: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
        icon: lucide_react_1.Zap,
        iconColor: "text-purple-400",
        btnColor: "bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/20",
    },
    moderate: {
        border: "border-amber-500/30",
        bg: "bg-amber-500/5",
        badgeBg: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        icon: lucide_react_1.Clock,
        iconColor: "text-amber-400",
        btnColor: "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20",
    },
    chill: {
        border: "border-emerald-500/30",
        bg: "bg-emerald-500/5",
        badgeBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        icon: lucide_react_1.MessageSquare,
        iconColor: "text-emerald-400",
        btnColor: "bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/20",
    },
};
function HeroActionCenter() {
    const [activeIndex, setActiveIndex] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        const interval = setInterval(() => {
            setActiveIndex((i) => (i + 1) % ACTIONS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl shadow-indigo-500/10 backdrop-blur-sm overflow-hidden flex flex-col h-[600px]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.01]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex gap-1.5", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-3 h-3 rounded-full bg-zinc-800" }), (0, jsx_runtime_1.jsx)("div", { className: "w-3 h-3 rounded-full bg-zinc-800" }), (0, jsx_runtime_1.jsx)("div", { className: "w-3 h-3 rounded-full bg-zinc-800" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4 text-xs font-medium text-zinc-600 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "w-3 h-3 text-indigo-500" }), "Duely App"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 overflow-hidden bg-zinc-950/40", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-16 border-r border-white/5 bg-zinc-950/80 flex flex-col items-center py-6 px-2 gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-full flex justify-center items-center p-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.LayoutDashboard, { className: "w-5 h-5 shrink-0" }) }), (0, jsx_runtime_1.jsx)("div", { className: "w-full flex justify-center items-center p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckSquare, { className: "w-5 h-5 shrink-0" }) }), (0, jsx_runtime_1.jsx)("div", { className: "w-full flex justify-center items-center p-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-5 h-5 shrink-0" }) }), (0, jsx_runtime_1.jsx)("div", { className: "w-full flex justify-center items-center p-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "w-5 h-5 shrink-0" }) }), (0, jsx_runtime_1.jsx)("div", { className: "w-full flex justify-center items-center p-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { className: "w-5 h-5 shrink-0" }) }), (0, jsx_runtime_1.jsx)("div", { className: "mt-auto w-full flex justify-center items-center p-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { className: "w-5 h-5 shrink-0" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 flex flex-col overflow-hidden relative", children: [(0, jsx_runtime_1.jsx)("div", { className: "px-6 py-5 border-b border-white/5 bg-zinc-950/80 sticky top-0 z-10", children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-between", children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold tracking-tight text-zinc-50", children: "Action Center" }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-1.5 flex items-center gap-3", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-zinc-400", children: ["You have ", (0, jsx_runtime_1.jsx)("span", { className: "text-zinc-200 font-medium", children: "4 manual actions" }), " to take today."] }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-px bg-white/10" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-indigo-400/80 flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bot, { className: "w-3 h-3" }), "Robots at work: 6 automated follow-ups going out"] })] })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 overflow-y-auto p-4 space-y-2.5 pb-20 custom-scrollbar relative", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" }), ACTIONS.map((action, i) => {
                                        const style = STYLES[action.type];
                                        const Icon = style.icon;
                                        const active = i === activeIndex;
                                        return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("overflow-hidden rounded-xl border transition-all duration-500 relative z-10", style.border, active ? style.bg : "bg-white/[0.02] border-white/[0.05]", active ? "ring-1 ring-white/10 shadow-lg shadow-black/20" : "opacity-70 hover:opacity-100"), children: (0, jsx_runtime_1.jsxs)("div", { className: "p-3 sm:p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("mt-0.5 flex shrink-0 rounded-lg p-2", style.badgeBg), children: (0, jsx_runtime_1.jsx)(Icon, { className: (0, utils_1.cn)("h-4 w-4", style.iconColor) }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-0.5", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-zinc-100 text-sm", children: action.headline }), action.type === 'critical' && active && ((0, jsx_runtime_1.jsxs)("span", { className: "flex h-2 w-2 relative", children: [(0, jsx_runtime_1.jsx)("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" }), (0, jsx_runtime_1.jsx)("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-red-500" })] }))] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-400 leading-relaxed max-w-lg", children: action.context })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right shrink-0", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs font-medium text-zinc-400 mb-0.5", children: action.clientName }), (0, jsx_runtime_1.jsx)("div", { className: "text-base font-bold text-zinc-100", children: action.amount })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: (0, utils_1.cn)("flex items-center justify-end gap-2 pt-3 mt-3 border-t transition-all duration-500 overflow-hidden", active ? "border-white/10 opacity-100 max-h-20" : "border-white/5 opacity-0 max-h-0 pt-0 mt-0 border-transparent"), children: [action.type !== 'system' && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("button", { className: "text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors px-2", children: "Snooze" }), (0, jsx_runtime_1.jsx)("button", { className: "text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors px-2", children: "Log Promise" })] })), (0, jsx_runtime_1.jsxs)("button", { className: (0, utils_1.cn)("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-lg transition-all", style.btnColor), children: [action.primaryAction, (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-3.5 w-3.5" })] })] })] }) }, action.id));
                                    })] })] })] })] }));
}
