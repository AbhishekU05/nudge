"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerDetails = CustomerDetails;
const jsx_runtime_1 = require("react/jsx-runtime");
/*
 * CustomerDrawer — expandable side-drawer for full customer workflow.
 * Houses: payment log, partial payment form, promise form, notes,
 * follow-up drafting, and automation controls.
 * All forms post to server actions via native form action=.
 */
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const badge_1 = require("@/components/ui/badge");
const customers_1 = require("@/app/actions/customers");
const followup_templates_1 = require("@/lib/followup-templates");
const automation_settings_1 = require("@/components/site/automation-settings");
const utils_1 = require("@/lib/utils");
const types_1 = require("@/lib/types");
const link_1 = __importDefault(require("next/link"));
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(value, currency = "USD") {
    return new Intl.NumberFormat(undefined, {
        currency,
        style: "currency",
    }).format(Number(value));
}
// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------
function TabButton({ active, onClick, icon: Icon, label, }) {
    return ((0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: onClick, className: (0, utils_1.cn)("flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors", active
            ? "bg-white/[0.08] text-zinc-100"
            : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"), children: [(0, jsx_runtime_1.jsx)(Icon, { className: "h-4 w-4" }), label] }));
}
// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({ title, children, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600", children: title }), children] }));
}
function PaymentSourceBadge({ source }) {
    if (source === "customer") {
        return (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "success", children: "Customer confirmed" });
    }
    if (source === "adjustment") {
        return (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "muted", children: "Adjusted by you" });
    }
    return (0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "default", children: "Logged by you" });
}
function PaymentHistory({ customer }) {
    const history = customer.payment_history ?? [];
    return ((0, jsx_runtime_1.jsx)(Section, { title: "Payment history", children: history.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: history.map((payment) => ((0, jsx_runtime_1.jsxs)("div", { className: "group relative flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "min-w-0 transition-opacity group-hover:opacity-60", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-zinc-100", children: formatCurrency(Number(payment.amount), payment.currency) }), (0, jsx_runtime_1.jsx)(PaymentSourceBadge, { source: payment.source })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-zinc-600", children: new Date(payment.created_at).toLocaleString(undefined, {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsxs)("form", { action: customers_1.deletePaymentLog, className: "absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity", children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "log_id", value: payment.id }), (0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "customer_id", value: customer.id }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", variant: "danger", size: "sm", className: "h-8 w-8 p-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-4 w-4" }) })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ReceiptText, { className: "mt-0.5 h-4 w-4 shrink-0 text-zinc-600 transition-opacity group-hover:opacity-0" })] })] }, payment.id))) })) : ((0, jsx_runtime_1.jsx)("div", { className: "rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-zinc-600", children: "Payments you record for this customer will appear here with the exact amount and timestamp." })) }));
}
// ---------------------------------------------------------------------------
// Payment tab
// ---------------------------------------------------------------------------
function PaymentTab({ customer }) {
    const remaining = (0, types_1.getRemainingBalance)(customer);
    const paidPct = customer.amount_owed > 0
        ? Math.min(100, (Number(customer.amount_paid) / Number(customer.amount_owed)) * 100)
        : 0;
    const isFullyPaid = remaining <= 0;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-2 flex items-center justify-between text-sm", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-zinc-400", children: ["Paid:", " ", (0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-zinc-100", children: formatCurrency(Number(customer.amount_paid), customer.currency) })] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-zinc-400", children: ["Remaining:", " ", (0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-zinc-100", children: formatCurrency(remaining, customer.currency) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-2 w-full overflow-hidden rounded-full bg-white/[0.07]", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full rounded-full bg-emerald-500 transition-all duration-500", style: { width: `${paidPct}%` } }) }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1.5 text-right text-xs text-zinc-600", children: [paidPct.toFixed(0), "% collected of", " ", formatCurrency(Number(customer.amount_owed), customer.currency)] })] }), (0, jsx_runtime_1.jsxs)(Section, { title: "Due date", children: [(0, jsx_runtime_1.jsxs)("form", { action: customers_1.updateDueDate, className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "customer_id", value: customer.id }), (0, jsx_runtime_1.jsx)(input_1.Input, { type: "date", name: "due_date", defaultValue: customer.due_date ?? undefined, className: "flex-1" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", size: "sm", variant: "secondary", children: "Save" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1.5 text-xs text-zinc-600", children: "Leave blank to clear the due date." })] }), isFullyPaid ? ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: (0, utils_1.cn)("flex items-center gap-2 rounded-xl border px-4 py-3 text-sm", customer.client_paid_at
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                            : "border-indigo-500/25 bg-indigo-500/10 text-indigo-100"), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-4 w-4 shrink-0" }), (0, jsx_runtime_1.jsx)("span", { children: customer.client_paid_at ? ("Marked as paid by customer") : ("Marked as paid by you") })] }), customer.client_paid_at && ((0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-zinc-600", children: ["Customer confirmed on", " ", new Date(customer.client_paid_at).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            })] })), (0, jsx_runtime_1.jsx)(PaymentHistory, { customer: customer }), (0, jsx_runtime_1.jsxs)(Section, { title: "Undo payment", children: [(0, jsx_runtime_1.jsxs)("form", { action: customers_1.undoMarkAsPaid, children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "customer_id", value: customer.id }), (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", variant: "secondary", size: "sm", className: "w-full gap-1.5 text-zinc-400 hover:text-zinc-100", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Undo2, { className: "h-3.5 w-3.5" }), "Undo \u2014 reset to outstanding"] })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1.5 text-xs text-zinc-600", children: "Resets amount paid to 0 and moves the customer back to your active pipeline." })] }), (0, jsx_runtime_1.jsx)(Section, { title: "Correct amount", children: (0, jsx_runtime_1.jsxs)("form", { action: customers_1.correctAmountPaid, className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "customer_id", value: customer.id }), (0, jsx_runtime_1.jsx)(input_1.Input, { name: "new_amount_paid", inputMode: "decimal", placeholder: `Correct amount (of ${formatCurrency(Number(customer.amount_owed), customer.currency)})`, required: true }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", variant: "secondary", size: "sm", className: "w-full", children: "Update amount" })] }) })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(Section, { title: "Log payment", children: (0, jsx_runtime_1.jsxs)("form", { action: customers_1.recordPartialPayment, className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "customer_id", value: customer.id }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: `pay_amount_${customer.id}`, className: "sr-only", children: "Payment amount" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: `pay_amount_${customer.id}`, name: "payment_amount", inputMode: "decimal", placeholder: `Amount received (max ${formatCurrency(remaining, customer.currency)})`, required: true })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", size: "sm", className: "w-full", children: "Record payment" })] }) }), (0, jsx_runtime_1.jsx)(PaymentHistory, { customer: customer }), Number(customer.amount_paid) > 0 && ((0, jsx_runtime_1.jsxs)(Section, { title: "Correct amount paid", children: [(0, jsx_runtime_1.jsxs)("form", { action: customers_1.correctAmountPaid, className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "customer_id", value: customer.id }), (0, jsx_runtime_1.jsx)(input_1.Input, { name: "new_amount_paid", inputMode: "decimal", defaultValue: String(customer.amount_paid), placeholder: "Corrected amount", required: true }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", variant: "secondary", size: "sm", className: "w-full", children: "Update amount" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1.5 text-xs text-zinc-600", children: "Overwrites the recorded amount and recalculates status." })] })), (0, jsx_runtime_1.jsx)(Section, { title: "Mark as fully paid", children: (0, jsx_runtime_1.jsxs)("form", { action: customers_1.markFullyPaid, children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "customer_id", value: customer.id }), (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", variant: "secondary", size: "sm", className: "w-full", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-3.5 w-3.5" }), "Mark fully paid"] })] }) })] }))] }));
}
// ---------------------------------------------------------------------------
// Promise tab
// ---------------------------------------------------------------------------
function PromiseTab({ customer }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-5", children: [customer.promised_date && ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm", children: [(0, jsx_runtime_1.jsxs)("p", { className: "font-medium text-amber-200", children: ["Promised by ", new Date(customer.promised_date).toLocaleDateString()] }), customer.promise_notes && ((0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-amber-200/70", children: customer.promise_notes }))] })), (0, jsx_runtime_1.jsx)(Section, { title: "Record payment promise", children: (0, jsx_runtime_1.jsxs)("form", { action: customers_1.recordPaymentPromise, className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "customer_id", value: customer.id }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: `promised_date_${customer.id}`, children: "Promised by" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: `promised_date_${customer.id}`, name: "promised_date", type: "date", required: true, className: "mt-1.5", defaultValue: customer.promised_date ?? undefined })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: `promise_notes_${customer.id}`, children: "Notes (optional)" }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { id: `promise_notes_${customer.id}`, name: "promise_notes", placeholder: "e.g. Will pay after invoice approval", maxLength: 500, className: "mt-1.5", defaultValue: customer.promise_notes ?? undefined })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", size: "sm", className: "w-full", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-3.5 w-3.5" }), "Save promise"] })] }) })] }));
}
// ---------------------------------------------------------------------------
// Follow-up drafting tab (template-based, no AI) + log follow-up form
// ---------------------------------------------------------------------------
const METHOD_OPTIONS = [
    { value: "email", label: "Email" },
    { value: "call", label: "Call" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "other", label: "Other" },
];
const OUTCOME_OPTIONS = [
    { value: "no_response", label: "No response" },
    { value: "promise_made", label: "Promise made" },
    { value: "partial_payment", label: "Partial payment" },
    { value: "paid_in_full", label: "Paid in full" },
];
const METHOD_LABELS = {
    email: "Email",
    call: "Call",
    whatsapp: "WhatsApp",
    other: "Other",
};
const OUTCOME_LABELS = {
    no_response: "No response",
    promise_made: "Promise made",
    partial_payment: "Partial payment",
    paid_in_full: "Paid in full",
};
const OUTCOME_COLORS = {
    no_response: "text-zinc-400",
    promise_made: "text-amber-300",
    partial_payment: "text-blue-300",
    paid_in_full: "text-emerald-300",
};
function FollowUpTimeline({ customer }) {
    const history = customer.followup_history ?? [];
    return ((0, jsx_runtime_1.jsx)(Section, { title: "Follow-up history", children: history.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: history.map((entry) => ((0, jsx_runtime_1.jsx)("div", { className: "rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "min-w-0 flex-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-2", children: [(0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "default", children: METHOD_LABELS[entry.method] }), (0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)("text-xs font-medium", OUTCOME_COLORS[entry.outcome]), children: OUTCOME_LABELS[entry.outcome] })] }), entry.note && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1.5 text-sm text-zinc-300", children: entry.note })), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-zinc-600", children: new Date(entry.followup_date).toLocaleDateString(undefined, {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    }) })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.History, { className: "mt-0.5 h-4 w-4 shrink-0 text-zinc-600" })] }) }, entry.id))) })) : ((0, jsx_runtime_1.jsx)("div", { className: "rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-zinc-600", children: "Follow-ups you log will appear here as a timeline." })) }));
}
function FollowUpTab({ customer }) {
    const daysOverdue = (0, types_1.getDaysOverdue)(customer);
    const remaining = (0, types_1.getRemainingBalance)(customer);
    const amountStr = formatCurrency(remaining, customer.currency);
    const [tone, setTone] = (0, react_1.useState)("professional");
    const [editedDraft, setEditedDraft] = (0, react_1.useState)(() => followup_templates_1.FOLLOWUP_TEMPLATES["professional"](customer.recipient_name, amountStr, daysOverdue));
    const [copied, setCopied] = (0, react_1.useState)(false);
    function handleToneChange(newTone) {
        setTone(newTone);
        setEditedDraft(followup_templates_1.FOLLOWUP_TEMPLATES[newTone](customer.recipient_name, amountStr, daysOverdue));
    }
    const handleCopy = async () => {
        await navigator.clipboard.writeText(editedDraft);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const tones = [
        { value: "friendly", label: "Friendly", desc: "Warm & casual" },
        { value: "professional", label: "Professional", desc: "Neutral & clear" },
        { value: "firm", label: "Firm", desc: "Direct & assertive" },
    ];
    const today = new Date().toISOString().split("T")[0];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)(Section, { title: "Log a follow-up", children: (0, jsx_runtime_1.jsxs)("form", { action: customers_1.logFollowUp, className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "customer_id", value: customer.id }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: `followup_date_${customer.id}`, children: "Date" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: `followup_date_${customer.id}`, name: "followup_date", type: "date", defaultValue: today, required: true, className: "mt-1.5" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: `followup_method_${customer.id}`, children: "Method" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-1.5 grid grid-cols-4 gap-2", children: METHOD_OPTIONS.map((m) => ((0, jsx_runtime_1.jsxs)("label", { className: "flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs text-zinc-400 transition-colors has-[:checked]:border-primary/40 has-[:checked]:bg-primary/10 has-[:checked]:text-indigo-200 hover:border-white/20", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "method", value: m.value, defaultChecked: m.value === "email", className: "sr-only" }), m.label] }, m.value))) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: `followup_note_${customer.id}`, children: "Short note (optional)" }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { id: `followup_note_${customer.id}`, name: "note", placeholder: "e.g. Left a voicemail, will call back tomorrow", maxLength: 500, rows: 2, className: "mt-1.5" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: `followup_outcome_${customer.id}`, children: "Outcome" }), (0, jsx_runtime_1.jsx)("select", { id: `followup_outcome_${customer.id}`, name: "outcome", defaultValue: "no_response", className: "mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-white/20 focus:border-primary/40 focus:outline-none", children: OUTCOME_OPTIONS.map((o) => ((0, jsx_runtime_1.jsx)("option", { value: o.value, className: "bg-zinc-900 text-zinc-300", children: o.label }, o.value))) })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", size: "sm", className: "w-full gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "h-3.5 w-3.5" }), "Log follow-up"] })] }) }), (0, jsx_runtime_1.jsx)(FollowUpTimeline, { customer: customer }), (0, jsx_runtime_1.jsx)(Section, { title: "Tone", children: (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-3 gap-2", children: tones.map((t) => ((0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => handleToneChange(t.value), className: (0, utils_1.cn)("rounded-xl border px-3 py-2.5 text-left transition-colors", tone === t.value
                            ? "border-primary/40 bg-primary/10 text-indigo-200"
                            : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20"), children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold", children: t.label }), (0, jsx_runtime_1.jsx)("p", { className: "mt-0.5 text-[10px] leading-none text-zinc-600", children: t.desc })] }, t.value))) }) }), (0, jsx_runtime_1.jsxs)(Section, { title: "Draft message", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(textarea_1.Textarea, { value: editedDraft, onChange: (e) => setEditedDraft(e.target.value), rows: 9, className: "resize-none pr-20 font-mono text-xs leading-6 text-zinc-300" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleCopy, className: "absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-background/90 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-zinc-100", children: copied ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "h-3 w-3 text-emerald-400" }), " Copied"] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Copy, { className: "h-3 w-3" }), " Copy"] })) })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-600", children: "Edit freely \u2014 switching tone resets to template." })] }), customer.payment_link && ((0, jsx_runtime_1.jsxs)("a", { href: customer.payment_link, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Link2, { className: "h-3.5 w-3.5" }), "Payment link attached"] }))] }));
}
// ---------------------------------------------------------------------------
// Notes tab
// ---------------------------------------------------------------------------
function NotesTab({ customer }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: (0, jsx_runtime_1.jsx)(Section, { title: "Internal notes", children: (0, jsx_runtime_1.jsxs)("form", { action: customers_1.saveInternalNotes, className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "customer_id", value: customer.id }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { name: "internal_notes", placeholder: "Notes about this customer \u2014 not sent to them.", maxLength: 2000, rows: 8, defaultValue: customer.internal_notes ?? undefined }), (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", size: "sm", className: "w-full", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "h-3.5 w-3.5" }), "Save notes"] })] }) }) }));
}
// ---------------------------------------------------------------------------
// Automation tab (demoted — "escalation" framing)
// ---------------------------------------------------------------------------
function AutomationTab({ customer, isDevelopment, isAllowed, }) {
    return ((0, jsx_runtime_1.jsx)(automation_settings_1.AutomationSettings, { entityType: "invoice", entityId: customer.id, active: customer.active, autoApprove: customer.auto_approve, reminderType: customer.reminder_type, reminderTemplates: customer.reminder_templates || [], targetEmail: customer.recipient_email, isAllowed: isAllowed }));
}
// ---------------------------------------------------------------------------
// Timeline tab
// ---------------------------------------------------------------------------
function TimelineTab({ customer }) {
    const entries = [];
    // 1. Paid events
    if (customer.client_paid_at) {
        entries.push({
            id: `${customer.id}-paid-client`,
            label: "Marked paid by customer",
            at: customer.client_paid_at,
            tone: "success",
            icon: lucide_react_1.CheckCircle2,
        });
    }
    else if (customer.workflow_status === "paid") {
        entries.push({
            id: `${customer.id}-paid-you`,
            label: "Marked paid by you",
            at: customer.updated_at,
            tone: "success",
            icon: lucide_react_1.CheckCircle2,
        });
    }
    // 2. Promise events
    if (customer.promised_date) {
        entries.push({
            id: `${customer.id}-promised`,
            label: "Payment promised",
            sub: `Promised by ${new Date(customer.promised_date).toLocaleDateString()}${customer.promise_notes ? ` - ${customer.promise_notes}` : ''}`,
            at: customer.updated_at,
            tone: "primary",
            icon: lucide_react_1.Clock,
        });
    }
    // 4. Payment History (manual partial payments)
    for (const payment of customer.payment_history ?? []) {
        entries.push({
            id: `${payment.id}-payment`,
            label: "Payment logged",
            sub: formatCurrency(Number(payment.amount), payment.currency),
            at: payment.created_at,
            tone: "success",
            icon: lucide_react_1.ReceiptText,
        });
    }
    // 5. Followup History
    for (const followup of customer.followup_history ?? []) {
        entries.push({
            id: `${followup.id}-followup`,
            label: `Follow-up: ${followup.method}`,
            sub: `Outcome: ${followup.outcome}${followup.note ? ` - ${followup.note}` : ''}`,
            at: followup.created_at,
            tone: "default",
            icon: lucide_react_1.MessageSquare,
        });
    }
    // 6. Creation date
    entries.push({
        id: `${customer.id}-created`,
        label: "Customer added",
        at: customer.created_at,
        tone: "muted",
    });
    const sorted = entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const dotColors = {
        success: "bg-emerald-400 text-emerald-400 border-emerald-400/20",
        warning: "bg-red-400 text-red-400 border-red-400/20",
        primary: "bg-indigo-400 text-indigo-400 border-indigo-400/20",
        default: "bg-blue-400 text-blue-400 border-blue-400/20",
        muted: "bg-zinc-500 text-zinc-500 border-zinc-500/20",
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: (0, jsx_runtime_1.jsx)(Section, { title: "Activity Timeline", children: (0, jsx_runtime_1.jsx)("div", { className: "relative border-l border-white/10 ml-3 pl-6 space-y-6 py-2", children: sorted.map((item) => {
                    const Icon = item.icon;
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("absolute -left-[30px] top-1 h-3 w-3 rounded-full border-2 bg-background", dotColors[item.tone]) }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-zinc-200", children: item.label }), Icon && (0, jsx_runtime_1.jsx)(Icon, { className: (0, utils_1.cn)("h-3.5 w-3.5", dotColors[item.tone].split(" ")[1]) })] }), item.sub && (0, jsx_runtime_1.jsx)("p", { className: "mt-0.5 text-sm text-zinc-400", children: item.sub }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-zinc-600", children: new Date(item.at).toLocaleString() })] })] }, item.id));
                }) }) }) }));
}
// ---------------------------------------------------------------------------
// Main drawer component
// ---------------------------------------------------------------------------
function CustomerDetails({ customer, group, initialTab = "timeline", isDevelopment, isAllowed = true, }) {
    const [tab, setTab] = (0, react_1.useState)(initialTab);
    if (!customer)
        return null;
    const daysOverdue = (0, types_1.getDaysOverdue)(customer);
    const remaining = (0, types_1.getRemainingBalance)(customer);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col mx-auto max-w-4xl pt-8 pb-16 px-4 sm:px-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-2", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold tracking-tight text-zinc-50", children: customer.customer_id ? ((0, jsx_runtime_1.jsx)(link_1.default, { href: `/customers/${customer.customer_id}`, className: "hover:underline hover:text-indigo-400", children: customer.recipient_name })) : (customer.recipient_name) }), group && ((0, jsx_runtime_1.jsx)("span", { className: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border", style: {
                                        backgroundColor: `${group.color || "#3b82f6"}20`,
                                        color: group.color || "#3b82f6",
                                        borderColor: `${group.color || "#3b82f6"}40`,
                                    }, children: group.name })), remaining <= 0 && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: customer.client_paid_at ? "success" : "default", children: customer.client_paid_at ? "Customer marked paid" : "You marked paid" })), daysOverdue && ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "danger", children: [daysOverdue, "d overdue"] }))] }), (0, jsx_runtime_1.jsxs)("form", { action: customers_1.updateCustomerEmail, className: "mt-1.5 flex items-center gap-2 max-w-[280px]", children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "customer_id", value: customer.id }), (0, jsx_runtime_1.jsx)(input_1.Input, { name: "recipient_email", type: "email", defaultValue: customer.recipient_email || "", placeholder: "Add email address...", required: true, className: "h-7 text-xs bg-transparent border-white/10 hover:border-white/20 px-2 flex-1 min-w-0" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", variant: "secondary", size: "sm", className: "h-7 px-2.5 text-xs shrink-0", children: "Save" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-3 flex flex-wrap gap-4 text-sm", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-zinc-600", children: "Total due " }), (0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-zinc-100", children: formatCurrency(Number(customer.amount_owed), customer.currency) })] }), remaining !== Number(customer.amount_owed) && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-zinc-600", children: "Remaining " }), (0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-zinc-100", children: formatCurrency(remaining, customer.currency) })] })), customer.due_date && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-zinc-600", children: "Due " }), (0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)("font-semibold", daysOverdue ? "text-red-300" : "text-zinc-100"), children: new Date(customer.due_date).toLocaleDateString() })] }))] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2 border-b border-border pb-4 mb-6", children: [(0, jsx_runtime_1.jsx)(TabButton, { active: tab === "timeline", onClick: () => setTab("timeline"), icon: lucide_react_1.History, label: "Timeline" }), (0, jsx_runtime_1.jsx)(TabButton, { active: tab === "payment", onClick: () => setTab("payment"), icon: lucide_react_1.CheckCircle2, label: "Payment" }), (0, jsx_runtime_1.jsx)(TabButton, { active: tab === "promise", onClick: () => setTab("promise"), icon: lucide_react_1.Clock, label: "Promise" }), (0, jsx_runtime_1.jsx)(TabButton, { active: tab === "followup", onClick: () => setTab("followup"), icon: lucide_react_1.MessageSquare, label: "Follow-up" }), (0, jsx_runtime_1.jsx)(TabButton, { active: tab === "notes", onClick: () => setTab("notes"), icon: lucide_react_1.FileText, label: "Notes" }), (0, jsx_runtime_1.jsx)(TabButton, { active: tab === "automation", onClick: () => setTab("automation"), icon: lucide_react_1.Zap, label: "Automation" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col lg:flex-row gap-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [tab === "timeline" && (0, jsx_runtime_1.jsx)(TimelineTab, { customer: customer }), tab === "payment" && (0, jsx_runtime_1.jsx)(PaymentTab, { customer: customer }), tab === "promise" && (0, jsx_runtime_1.jsx)(PromiseTab, { customer: customer }), tab === "followup" && (0, jsx_runtime_1.jsx)(FollowUpTab, { customer: customer }), tab === "notes" && (0, jsx_runtime_1.jsx)(NotesTab, { customer: customer }), tab === "automation" && (0, jsx_runtime_1.jsx)(AutomationTab, { customer: customer, isDevelopment: isDevelopment, isAllowed: isAllowed })] }), (0, jsx_runtime_1.jsx)("div", { className: "lg:w-64 shrink-0 space-y-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "rounded-xl border border-red-500/10 bg-red-500/5 p-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-semibold text-red-400 mb-2", children: "Danger Zone" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500 mb-4", children: "Permanently remove this customer and all their associated data." }), (0, jsx_runtime_1.jsxs)("form", { action: customers_1.deleteCustomer, children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "customer_id", value: customer.id }), (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", variant: "danger", size: "sm", className: "w-full gap-2", onClick: (e) => {
                                                if (!window.confirm(`Delete ${customer.recipient_name}? This cannot be undone.`)) {
                                                    e.preventDefault();
                                                }
                                            }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-4 w-4" }), "Delete customer"] })] })] }) })] })] }));
}
