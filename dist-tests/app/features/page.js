"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = FeaturesPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const container_1 = require("@/components/site/container");
const site_header_1 = require("@/components/site/site-header");
const site_footer_1 = require("@/components/site/site-footer");
exports.metadata = {
    title: "Features — Duely",
    description: "Everything Duely does to help you collect outstanding invoices faster — Action Center, automated reminders, late fees, client portal, Gmail integration, and more.",
    alternates: { canonical: "/features" },
};
const featureGroups = [
    {
        group: "Collections",
        desc: "The core of Duely — built around actually getting paid.",
        features: [
            {
                title: "Action Center",
                desc: "A daily prioritized queue scored by invoice aging, broken promises, and financial risk. Every morning you open Duely, you know exactly who to contact first — no spreadsheet required.",
            },
            {
                title: "Collections Pipeline",
                desc: "A kanban board showing every client across Outstanding, Overdue, and Paid columns. Drag clients between stages, filter by overdue range, and get a snapshot of your entire accounts receivable at a glance.",
            },
            {
                title: "Payment promise tracking",
                desc: "When a client says they'll pay by Friday, log it. Duely tracks the promise, resurfaces it when the date passes, and moves the client up your Action Center queue automatically if they don't follow through.",
            },
            {
                title: "Partial payment logging",
                desc: "Record partial payments against any invoice with a running balance tracker and progress bar. Know exactly how much is still owed and how many payments have come in on every single invoice.",
            },
            {
                title: "Activity timeline",
                desc: "A full chronological log of every interaction per client — calls, emails, WhatsApp messages, partial payments, promises, and notes. Complete context before every follow-up, always.",
            },
            {
                title: "Internal notes",
                desc: "Add private notes to any client record. Log context about their situation, things they've said, or follow-up instructions for yourself. Notes are yours alone — clients never see them.",
            },
        ],
    },
    {
        group: "Automation",
        desc: "Set rules once. Let Duely handle the follow-up.",
        features: [
            {
                title: "Automated reminders",
                desc: "Configure a recurring schedule (e.g. every 7 days) or a multi-step email sequence with different messages at different intervals. Reminders fire automatically on your behalf — and pause the moment you log any manual contact.",
            },
            {
                title: "Smart cooldowns",
                desc: "When you log a call, send a manual email, or record a WhatsApp message, Duely automatically pauses the automation sequence for that client. You'll never send an automated follow-up right after a real conversation.",
            },
            {
                title: "Auto-approve mode",
                desc: "Turn on auto-approve and reminders go out without any confirmation needed. Turn it off and every reminder queues as a draft for you to review first. Full control over how hands-off you want to be.",
            },
            {
                title: "Late fee automation",
                desc: "Set a flat or percentage late fee policy with a grace period and frequency (e.g. 5% monthly, after 14 days). Duely automatically applies and logs the fee to chronically late invoices on your configured schedule.",
            },
            {
                title: "Follow-up email drafting",
                desc: "Generate a follow-up email in one click from any client record. Choose a tone — Friendly, Professional, or Firm — and Duely writes a contextual draft based on the invoice amount, days overdue, and client history.",
            },
        ],
    },
    {
        group: "Integrations",
        desc: "Connect your existing tools. No manual data entry.",
        features: [
            {
                title: "Gmail integration",
                desc: "Connect your Google account and all automated reminders send from your own Gmail address. Replies land back in your inbox. To clients, it looks like a normal email from you — not from a no-reply system.",
            },
            {
                title: "Xero sync",
                desc: "Connect Xero and your invoices import automatically, staying in sync as new invoices are raised and payments are recorded. Duely reads your invoice status in real time — no CSV exports, no manual entry.",
            },
            {
                title: "QuickBooks sync",
                desc: "Connect QuickBooks Online and get the same automatic invoice sync as Xero. Outstanding and overdue invoices appear in Duely instantly. Payments recorded in QuickBooks mark the invoice as resolved.",
            },
            {
                title: "Stripe sync",
                desc: "If you invoice through Stripe, connect your account and Duely imports outstanding invoices automatically. Payment status updates flow back in real time as clients pay.",
            },
        ],
    },
    {
        group: "Client management",
        desc: "Keep your client relationships organised and segmented.",
        features: [
            {
                title: "Client portal",
                desc: "Generate a secure, unique link for any client. They can view their full outstanding balance, see which invoices are overdue, download any past invoice as a PDF, and pay directly — without emailing you to ask for any of it.",
            },
            {
                title: "Client groups & segmentation",
                desc: "Organise clients into named groups with custom tags. Apply different automation policies per group — exclude VIP accounts from aggressive follow-ups, or tighten the sequence on chronic late-payers.",
            },
            {
                title: "Client-level automation settings",
                desc: "Override the global automation settings for any individual client. Set a different reminder frequency, sequence, or cooldown period on a per-client basis without affecting the rest of your pipeline.",
            },
        ],
    },
    {
        group: "Analytics",
        desc: "Understand your collections performance over time.",
        features: [
            {
                title: "Collection trend charts",
                desc: "See how much you've collected each month as a bar or line chart. Track whether your recovery rate is improving or declining, and spot seasonal patterns in client payment behaviour.",
            },
            {
                title: "Overdue aging breakdown",
                desc: "Visualise your outstanding AR by how long it's been overdue — under 30 days, 30–60, 60–90, and over 90. Know exactly where your risk is concentrated at any given time.",
            },
            {
                title: "Dashboard overview widgets",
                desc: "At-a-glance cards showing total outstanding, total overdue, number of clients with broken promises, and this month's collections. Everything you need to know about your AR in under five seconds.",
            },
        ],
    },
    {
        group: "Everything else",
        desc: "The details that make Duely feel solid.",
        features: [
            {
                title: "CSV export",
                desc: "Export your full collections pipeline to a CSV file at any time. Every client, invoice, outstanding balance, and status — in a format you can open in Excel, Sheets, or import anywhere else.",
            },
            {
                title: "Multi-currency support",
                desc: "Work with clients across different currencies. Set a default currency for your account and override it per client. Amounts are displayed clearly in the currency the invoice was raised in.",
            },
            {
                title: "Billing & subscription management",
                desc: "Manage your Duely subscription directly from the app. Upgrade, downgrade, or cancel from your billing settings at any time. No need to email anyone.",
            },
        ],
    },
];
function FeaturesPage() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 flex-col overflow-x-hidden", children: [(0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsxs)("main", { id: "main-content", className: "flex-1", children: [(0, jsx_runtime_1.jsx)("section", { className: "py-24 sm:py-32 border-b border-white/5", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "max-w-3xl text-center", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl", children: "Everything Duely does" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-5 text-lg leading-relaxed text-zinc-400 max-w-xl mx-auto", children: "Every feature, explained plainly. No marketing fluff." })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "py-16 sm:py-24", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "max-w-5xl", children: (0, jsx_runtime_1.jsx)("div", { className: "space-y-24", children: featureGroups.map((group) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-10 pb-6 border-b border-white/[0.06]", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold tracking-tight text-zinc-50", children: group.group }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-base text-zinc-500", children: group.desc })] }), (0, jsx_runtime_1.jsx)("div", { className: "divide-y divide-white/[0.04]", children: group.features.map((feature) => ((0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 py-6 sm:grid-cols-[280px_1fr]", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-base font-semibold text-zinc-100 pt-0.5", children: feature.title }), (0, jsx_runtime_1.jsx)("p", { className: "text-base leading-relaxed text-zinc-500", children: feature.desc })] }, feature.title))) })] }, group.group))) }) }) }), (0, jsx_runtime_1.jsx)("section", { className: "border-t border-white/5 py-20 sm:py-28", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "max-w-2xl text-center", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl", children: "Ready to stop chasing?" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-zinc-500", children: "Try everything free for 7 days. No card required." }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8 flex flex-wrap items-center justify-center gap-4", children: [(0, jsx_runtime_1.jsx)("a", { href: "/signup", className: "inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500", children: "Start free trial" }), (0, jsx_runtime_1.jsx)("a", { href: "/#pricing", className: "inline-flex items-center rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:text-zinc-50", children: "See pricing" })] })] }) })] }), (0, jsx_runtime_1.jsx)(site_footer_1.SiteFooter, {})] }));
}
