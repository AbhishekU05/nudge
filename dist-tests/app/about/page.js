"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = AboutPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const container_1 = require("@/components/site/container");
const site_header_1 = require("@/components/site/site-header");
const site_footer_1 = require("@/components/site/site-footer");
exports.metadata = {
    title: "About — Duely",
    description: "Learn why Duely was built, what we believe, and who we built it for — the independent professionals and small teams who deserve to get paid.",
    alternates: { canonical: "/about" },
};
const values = [
    {
        icon: lucide_react_1.Zap,
        title: "Speed over ceremony",
        body: "Every screen is designed for the person who has five minutes, not five hours. Fast to load, fast to act on.",
    },
    {
        icon: lucide_react_1.ShieldCheck,
        title: "Professional by default",
        body: "Every reminder that goes out looks like it came from a real business — because it did. Your reputation travels with every email.",
    },
    {
        icon: lucide_react_1.Heart,
        title: "Relationships first",
        body: "Collecting money is awkward. We write defaults that nudge firmly but never burn bridges. You keep the client after they pay.",
    },
    {
        icon: lucide_react_1.TrendingUp,
        title: "Visibility, not guesswork",
        body: "A clear picture of your AR is worth more than any reminder template. Know who owes what, and for how long, at a glance.",
    },
    {
        icon: lucide_react_1.Clock,
        title: "Time is the real asset",
        body: "Manual follow-up is a tax on your week. Automation should handle the routine so you only step in when it actually matters.",
    },
    {
        icon: lucide_react_1.Users,
        title: "Built for small teams",
        body: "Not a watered-down enterprise tool. Every feature is sized for one to ten people running a real services business.",
    },
];
const audiences = [
    {
        label: "Freelancers",
        slug: "freelancers",
        desc: "Solo operators who need a professional, low-effort system to recover overdue invoices without chasing clients every week.",
        accent: "from-indigo-500/20 to-violet-500/10",
        border: "border-indigo-500/20",
    },
    {
        label: "Small agencies",
        slug: "agencies",
        desc: "Teams of 2–15 people juggling multiple client accounts, retainers, and project invoices that need a unified AR view.",
        accent: "from-violet-500/20 to-purple-500/10",
        border: "border-violet-500/20",
    },
    {
        label: "Consultants",
        slug: "consultants",
        desc: "Independent advisors who bill on milestones or monthly retainers and need polished follow-up that matches their brand.",
        accent: "from-purple-500/20 to-indigo-500/10",
        border: "border-purple-500/20",
    },
];
function AboutPage() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 flex-col overflow-x-hidden", children: [(0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsxs)("main", { id: "main-content", className: "flex-1", children: [(0, jsx_runtime_1.jsxs)("section", { className: "relative border-b border-white/5 py-28 sm:py-36 overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-0 -z-10", style: {
                                    background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,70,229,0.28), transparent)",
                                } }), (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "max-w-4xl text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300", children: "Our story" }), (0, jsx_runtime_1.jsxs)("h1", { className: "text-pretty text-5xl font-bold tracking-[-0.04em] text-zinc-50 sm:text-6xl lg:text-7xl leading-[1.05]", children: ["Built because chasing", " ", (0, jsx_runtime_1.jsx)("span", { className: "bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent", children: "invoices is broken" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-400", children: "Duely started with a simple frustration \u2014 sending invoices is easy, getting paid is an unpaid part-time job. We built the tool we wished existed." }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-10 flex flex-wrap items-center justify-center gap-4", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/signup", className: "inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 hover:shadow-indigo-500/40", children: ["Start free trial", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4" })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/features", className: "inline-flex items-center gap-2 rounded-xl border border-white/10 px-7 py-3.5 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white", children: "See all features" })] })] })] }), (0, jsx_runtime_1.jsx)("section", { className: "border-b border-white/5 py-20 sm:py-28", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "max-w-5xl", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-16 lg:grid-cols-2 lg:gap-24 items-center", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-4", children: "Why we exist" }), (0, jsx_runtime_1.jsx)("h2", { className: "text-3xl font-bold tracking-[-0.03em] text-zinc-50 sm:text-4xl leading-snug", children: "The gap between sending an invoice and actually getting paid" }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 space-y-4 text-base leading-relaxed text-zinc-400", children: [(0, jsx_runtime_1.jsx)("p", { children: "Most invoicing tools stop the moment the invoice is sent. But that's not when the work ends \u2014 it's when the awkward part begins. Chasing clients over email, trying to remember who promised what, logging things in spreadsheets that go stale." }), (0, jsx_runtime_1.jsx)("p", { children: "Duely sits in the gap. It's not an invoicing tool and it's not a CRM. It's a dedicated accounts receivable workspace for small service businesses \u2014 designed around the workflow of actually collecting money, not just recording it." }), (0, jsx_runtime_1.jsx)("p", { children: "We connect to the tools you already use (Xero, QuickBooks, Stripe, Gmail), pull in what you're owed, and give you a clear, prioritised system to work through it every day." })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/[0.07] bg-white/[0.025] p-8 sm:p-10 space-y-8", children: [[
                                                {
                                                    stat: "47%",
                                                    label: "of invoices sent by freelancers are paid late",
                                                },
                                                {
                                                    stat: "3–4 hrs",
                                                    label: "per week spent on manual follow-up by the average consultant",
                                                },
                                                {
                                                    stat: "1 in 5",
                                                    label: "small business invoices are never paid at all",
                                                },
                                            ].map(({ stat, label }) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-5", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-3xl font-bold text-indigo-400 tabular-nums shrink-0 min-w-[4rem]", children: stat }), (0, jsx_runtime_1.jsx)("p", { className: "text-base leading-relaxed text-zinc-400 pt-1", children: label })] }, stat))), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600 pt-2 border-t border-white/5", children: "Sources: Xero Small Business Insights, FreshBooks State of Self-Employment" })] })] }) }) }), (0, jsx_runtime_1.jsx)("section", { className: "border-b border-white/5 py-20 sm:py-28", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "max-w-5xl", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-14 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-4", children: "What we believe" }), (0, jsx_runtime_1.jsx)("h2", { className: "text-3xl font-bold tracking-[-0.03em] text-zinc-50 sm:text-4xl", children: "Principles that shape every decision" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: values.map(({ icon: Icon, title, body }) => ((0, jsx_runtime_1.jsxs)("div", { className: "group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/[0.04]", children: [(0, jsx_runtime_1.jsx)("div", { className: "mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 transition-colors group-hover:border-indigo-500/40 group-hover:bg-indigo-500/15", children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "mb-2 text-base font-semibold text-zinc-100", children: title }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm leading-relaxed text-zinc-500", children: body })] }, title))) })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "border-b border-white/5 py-20 sm:py-28", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "max-w-5xl", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-14 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-4", children: "Who it's for" }), (0, jsx_runtime_1.jsx)("h2", { className: "text-3xl font-bold tracking-[-0.03em] text-zinc-50 sm:text-4xl", children: "Made for the people doing the work" }), (0, jsx_runtime_1.jsx)("p", { className: "mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400", children: "Not for enterprise finance teams. For the people who send the invoice, do the work, and then have to chase the payment themselves." })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:grid-cols-3", children: audiences.map(({ label, slug, desc, accent, border }) => ((0, jsx_runtime_1.jsxs)("div", { className: `relative overflow-hidden rounded-2xl border ${border} bg-gradient-to-br ${accent} p-8`, children: [(0, jsx_runtime_1.jsx)("div", { "aria-hidden": true, className: "absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5 blur-2xl" }), (0, jsx_runtime_1.jsx)("h3", { className: "mb-3 text-xl font-bold text-zinc-50", children: label }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm leading-relaxed text-zinc-400", children: desc }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: `/for-${slug}`, className: "mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 transition hover:text-indigo-300", children: ["Learn more ", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-3.5 w-3.5" })] })] }, label))) })] }) }), (0, jsx_runtime_1.jsxs)("section", { className: "py-24 sm:py-32 relative overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-0 -z-10", style: {
                                    background: "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(79,70,229,0.22), transparent)",
                                } }), (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "max-w-2xl text-center", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-3xl font-bold tracking-[-0.03em] text-zinc-50 sm:text-4xl", children: "Stop losing money to late payments" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-base leading-relaxed text-zinc-400", children: "Join the independent professionals using Duely to get paid faster, with less awkwardness and zero spreadsheets." }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-10 flex flex-wrap items-center justify-center gap-4", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/signup", className: "inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 hover:shadow-indigo-500/40", children: ["Try Duely free for 7 days", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4" })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/how-it-works", className: "inline-flex items-center gap-2 rounded-xl border border-white/10 px-7 py-3.5 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white", children: "See how it works" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-5 text-sm text-zinc-600", children: "No credit card required \u00B7 Cancel any time" })] })] })] }), (0, jsx_runtime_1.jsx)(site_footer_1.SiteFooter, {})] }));
}
