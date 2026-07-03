"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationSetupForm = AutomationSetupForm;
const jsx_runtime_1 = require("react/jsx-runtime");
/*
 * AutomationSetupForm — client component rendered on /reminders/new.
 * Handles the interactive tone picker, live email preview, and the
 * form that calls the enableAutomation server action.
 */
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const customers_1 = require("@/app/actions/customers");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const utils_1 = require("@/lib/utils");
// ---------------------------------------------------------------------------
// Tone template notes (pre-fill for the custom_message field)
// ---------------------------------------------------------------------------
const getToneTemplates = (amount) => ({
    polite: `Just a friendly follow-up about your outstanding balance of ${amount}. I completely understand if things are busy — whenever is convenient for you is perfectly fine. Feel free to reach out if you have any questions at all.`,
    neutral: `This is a reminder about your outstanding balance of ${amount}. Please let me know if you have any questions or need any clarification. Happy to help.`,
    firm: `This is a formal notice that your balance of ${amount} remains outstanding and requires your prompt attention. Please arrange payment at your earliest convenience and confirm via reply.`,
});
const TONE_CONFIG = {
    polite: {
        label: "Polite",
        desc: "Warm & understanding",
        icon: lucide_react_1.Leaf,
        activeClass: "border-emerald-500/50 bg-emerald-500/10",
        iconClass: "text-emerald-400",
    },
    neutral: {
        label: "Neutral",
        desc: "Clear & professional",
        icon: lucide_react_1.FileText,
        activeClass: "border-primary/50 bg-primary/10",
        iconClass: "text-primary",
    },
    firm: {
        label: "Firm",
        desc: "Direct & assertive",
        icon: lucide_react_1.AlertOctagon,
        activeClass: "border-amber-500/50 bg-amber-500/10",
        iconClass: "text-amber-400",
    },
};
// ---------------------------------------------------------------------------
// Email preview
// ---------------------------------------------------------------------------
function EmailPreview({ recipientName, senderName, amount, subject, note, paymentLink, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-xl shadow-black/40", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border-b border-white/[0.06] bg-white/[0.03] px-5 py-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-semibold uppercase tracking-widest text-zinc-600", children: "Subject" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-0.5 text-sm font-semibold text-zinc-200", children: subject || "Payment reminder" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "px-5 py-5 text-sm leading-6 font-mono text-zinc-300 whitespace-pre-wrap", children: ["Hi ", recipientName || "there", ",", (0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsx)("br", {}), note, paymentLink && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsx)("br", {}), "Here's the payment link: ", paymentLink] })), (0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsx)("br", {}), "Best,", (0, jsx_runtime_1.jsx)("br", {}), senderName] })] }));
}
// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function AutomationSetupForm({ customer, senderName, error, }) {
    const amount = new Intl.NumberFormat(undefined, {
        currency: customer.currency,
        style: "currency",
    }).format(Number(customer.amount_owed));
    const [tone, setTone] = (0, react_1.useState)("neutral");
    const [subject, setSubject] = (0, react_1.useState)(`Following up on your balance with ${senderName}`);
    const [note, setNote] = (0, react_1.useState)(getToneTemplates(amount).neutral);
    const [paymentLink, setPaymentLink] = (0, react_1.useState)("");
    function handleToneSelect(t) {
        setTone(t);
        setNote(getToneTemplates(amount)[t]);
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]", children: [(0, jsx_runtime_1.jsxs)("form", { action: customers_1.enableAutomation, className: "space-y-7", children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "customer_id", value: customer.id }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-widest text-zinc-600", children: "Email tone" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-3 gap-3", children: ["polite", "neutral", "firm"].map((t) => {
                                    const cfg = TONE_CONFIG[t];
                                    const Icon = cfg.icon;
                                    const active = tone === t;
                                    return ((0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => handleToneSelect(t), className: (0, utils_1.cn)("relative flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all", active
                                            ? cfg.activeClass
                                            : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]"), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Pencil, { className: "absolute right-3 top-3 h-3 w-3 text-zinc-600" }), (0, jsx_runtime_1.jsx)(Icon, { className: (0, utils_1.cn)("h-4 w-4", active ? cfg.iconClass : "text-zinc-500") }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: (0, utils_1.cn)("text-xs font-semibold", active ? "text-zinc-100" : "text-zinc-400"), children: cfg.label }), (0, jsx_runtime_1.jsx)("p", { className: "mt-0.5 text-[10px] leading-none text-zinc-600", children: cfg.desc })] })] }, t));
                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)(label_1.Label, { htmlFor: "email_subject", className: "flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "h-3.5 w-3.5 text-zinc-500" }), "Subject line", " ", (0, jsx_runtime_1.jsx)("span", { className: "text-zinc-600", children: "(editable)" })] }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "email_subject", name: "email_subject", type: "text", value: subject, onChange: (e) => setSubject(e.target.value), maxLength: 100, placeholder: "Payment reminder" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)(label_1.Label, { htmlFor: "custom_message", className: "flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Pencil, { className: "h-3.5 w-3.5 text-indigo-300" }), "Email body", " ", (0, jsx_runtime_1.jsx)("span", { className: "text-zinc-600", children: "(edit freely)" })] }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { id: "custom_message", name: "custom_message", value: note, onChange: (e) => setNote(e.target.value), maxLength: 1000, rows: 6, placeholder: "The main body of the reminder email." }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-zinc-600", children: ["This will be sent as a plain text email. ", 1000 - note.length, " chars remaining."] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)(label_1.Label, { htmlFor: "payment_link", className: "flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Link2, { className: "h-3.5 w-3.5 text-zinc-500" }), "Payment link", " ", (0, jsx_runtime_1.jsx)("span", { className: "text-zinc-600", children: "(optional)" })] }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "payment_link", name: "payment_link", type: "url", placeholder: "https://checkout.example.com/invoice/123", maxLength: 2048, value: paymentLink, onChange: (e) => setPaymentLink(e.target.value) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: "Adds a \u201CPay now\u201D button to the email." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)(label_1.Label, { htmlFor: "reminder_frequency_days", className: "flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-3.5 w-3.5 text-zinc-500" }), "Send every"] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(input_1.Input, { id: "reminder_frequency_days", name: "reminder_frequency_days", type: "number", min: 1, defaultValue: 7, className: "w-24" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-zinc-500", children: "days" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: "First email sends in ~5 minutes. Subsequent emails follow this interval." })] }), error && ((0, jsx_runtime_1.jsx)("p", { className: "rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200", role: "alert", children: error })), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", className: "gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "h-3.5 w-3.5" }), "Enable automation"] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: "You can pause or stop anytime from the dashboard." })] })] }), (0, jsx_runtime_1.jsxs)("aside", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-widest text-zinc-600", children: "Email preview" }), (0, jsx_runtime_1.jsx)(EmailPreview, { recipientName: customer.recipient_name, senderName: senderName, amount: amount, subject: subject, note: note, paymentLink: paymentLink })] })] }));
}
