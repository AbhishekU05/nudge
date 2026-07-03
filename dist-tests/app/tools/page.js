"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = ToolsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const site_header_1 = require("@/components/site/site-header");
const site_footer_1 = require("@/components/site/site-footer");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const container_1 = require("@/components/site/container");
const card_1 = require("@/components/ui/card");
exports.metadata = {
    alternates: {
        canonical: "/tools",
    },
    description: "Free Duely tools for agency owners to understand payment delays, collections risk, and cash-flow leakage.",
    title: "Free Agency Tools",
};
const tools = [
    {
        description: "Estimate how much working capital is trapped in delayed client payments.",
        href: "/tools/payment-leak-calculator",
        icon: lucide_react_1.Calculator,
        label: "Agency Payment Leak Estimator",
        status: "available",
    },
    {
        description: "Evaluate the maturity of your collections process and identify operational weaknesses.",
        href: "/tools/collections-maturity-assessment",
        icon: lucide_react_1.ClipboardList,
        label: "Collections Maturity Assessment",
        status: "available",
    },
    {
        description: "Generate a professional invoice follow-up email in seconds. Choose your tone and get a message ready to send.",
        href: "/tools/invoice-followup-generator",
        icon: lucide_react_1.FileText,
        label: "Invoice Follow-Up Generator",
        status: "available",
    },
    {
        description: "Calculate how much of your annual revenue is delayed and the hidden costs to your business's working capital.",
        href: "/tools/revenue-at-risk-estimator",
        icon: lucide_react_1.DollarSign,
        label: "Revenue At Risk Estimator",
        status: "available",
    },
    {
        description: "Calculate the exact ROI of automating your collections and see the cost of manual follow-ups.",
        href: "/tools/collections-roi-calculator",
        icon: lucide_react_1.Receipt,
        label: "Collections ROI Calculator",
        status: "available",
    },
    {
        description: "Generate professional payment terms for your contracts or invoices based on project type.",
        href: "/tools/payment-terms-generator",
        icon: lucide_react_1.FileText,
        label: "Payment Terms Generator",
        status: "available",
    }
];
const comingSoon = [];
function ToolsPage() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-background text-foreground", children: [(0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsxs)("main", { id: "main-content", children: [(0, jsx_runtime_1.jsx)("section", { className: "border-b border-white/10 py-12 sm:py-16", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300", children: "Duely Tools" }), (0, jsx_runtime_1.jsx)("h1", { className: "mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl", children: "Free tools for agency cash-flow diagnostics." }), (0, jsx_runtime_1.jsx)("p", { className: "mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg", children: "Use these tools to diagnose delayed-payment risk and evaluate your collections process before problems escalate." })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "py-10 sm:py-12", children: (0, jsx_runtime_1.jsx)(container_1.Container, { children: (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-5 md:grid-cols-2 xl:grid-cols-3", children: [tools.map((tool) => {
                                        const Icon = tool.icon;
                                        return ((0, jsx_runtime_1.jsx)(link_1.default, { href: tool.href, className: "group block", children: (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "h-full border-white/10 bg-white/[0.03] transition-colors group-hover:bg-white/[0.06]", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)("div", { className: "mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-300", children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: tool.label })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm leading-6 text-zinc-400", children: tool.description }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 flex items-center justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("span", { className: "inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { className: "h-3.5 w-3.5 text-emerald-300" }), "Available now"] }), (0, jsx_runtime_1.jsxs)("span", { className: "inline-flex items-center gap-1 text-sm font-medium text-emerald-300", children: ["Open Tool", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4 transition-transform group-hover:translate-x-0.5" })] })] })] })] }) }, tool.href));
                                    }), comingSoon.map((tool) => {
                                        const Icon = tool.icon;
                                        return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-dashed border-white/10 bg-white/[0.015]", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)("div", { className: "mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400", children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-zinc-500", children: tool.label })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("span", { className: "inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-500", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-3.5 w-3.5" }), "Coming soon"] }) })] }, tool.label));
                                    })] }) }) })] }), (0, jsx_runtime_1.jsx)(site_footer_1.SiteFooter, {})] }));
}
