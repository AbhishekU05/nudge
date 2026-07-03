"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = FAQPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const site_header_1 = require("@/components/site/site-header");
const lucide_react_1 = require("lucide-react");
const container_1 = require("@/components/site/container");
const badge_1 = require("@/components/ui/badge");
const card_1 = require("@/components/ui/card");
const faqs = [
    {
        question: "What is Duely for?",
        answer: "Duely helps freelancers, agencies, and service businesses track unpaid customer balances, log partial payments, record promises, and follow up professionally.",
    },
    {
        question: "Is Duely an accounting system?",
        answer: "No. Duely is intentionally lighter than accounting software. It focuses on the post-invoice workflow: who owes what, what has been paid, what was promised, and when to follow up.",
    },
    {
        question: "Can I log partial payments?",
        answer: "Yes. You can record each payment amount against a customer and see the payment history with the timestamp for every logged payment.",
    },
    {
        question: "What happens when a customer clicks \"I've paid\"?",
        answer: "Duely marks the customer as customer-confirmed paid and stops active reminders. The dashboard shows that differently from a payment you marked as paid yourself.",
    },
    {
        question: "Can I edit reminder emails?",
        answer: "Yes. Tone templates give you a starting point, and the message text is editable before automation is enabled.",
    },
    {
        question: "How often can reminders be sent?",
        answer: "Automated reminders are capped to at least one day apart. Every reminder includes a clean unsubscribe path so customers can opt out.",
    },
    {
        question: "Do I need a payment link?",
        answer: "No. Payment links are optional. If you add one, Duely includes a Pay now button in the reminder email.",
    },
    {
        question: "Can I use Duely without automation?",
        answer: "Yes. You can use Duely purely as a collections tracker for balances, notes, promises, and payment history. Automation is a backup workflow.",
    },
];
exports.metadata = {
    title: "FAQ",
    description: "Answers to common questions about Duely payment tracking, reminders, customer confirmations, and billing.",
    alternates: { canonical: "/faq" },
};
function FAQPage() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex min-h-screen flex-col", children: [(0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-14 sm:py-20", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-3xl text-center", children: [(0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "default", className: "gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.HelpCircle, { className: "h-3 w-3" }), "FAQ"] }), (0, jsx_runtime_1.jsx)("h1", { className: "mt-6 text-5xl font-semibold tracking-[-0.055em] text-zinc-50 sm:text-6xl", children: "Common questions about Duely." }), (0, jsx_runtime_1.jsx)("p", { className: "mt-5 text-base leading-7 text-zinc-500", children: "Short answers for how Duely handles payment tracking, reminders, customer confirmations, and billing." })] }), (0, jsx_runtime_1.jsx)("div", { className: "mx-auto mt-12 grid max-w-5xl gap-3 md:grid-cols-2", children: faqs.map((faq) => ((0, jsx_runtime_1.jsx)(card_1.Card, { className: "bg-white/[0.03]", children: (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "p-5", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-base font-semibold text-zinc-50", children: faq.question }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-6 text-zinc-500", children: faq.answer })] }) }, faq.question))) }), (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-5 w-5 text-emerald-300" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm font-medium text-zinc-200", children: "Payment history stays visible." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { className: "h-5 w-5 text-indigo-300" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm font-medium text-zinc-200", children: "Reminders are respectful by design." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.025] p-5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-5 w-5 text-amber-300" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm font-medium text-zinc-200", children: "Customers can confirm they paid." })] })] })] }) })] }));
}
