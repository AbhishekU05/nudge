"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityFeed = ActivityFeed;
const jsx_runtime_1 = require("react/jsx-runtime");
const date_fns_1 = require("date-fns");
const badge_1 = require("@/components/ui/badge");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const card_1 = require("@/components/ui/card");
function formatCurrency(value, currency = "USD") {
    return new Intl.NumberFormat(undefined, {
        currency,
        style: "currency",
        maximumFractionDigits: 0,
    }).format(Number(value));
}
function ActivityFeed({ events }) {
    if (!events || events.length === 0) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-12 text-center bg-white/[0.01]", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "mx-auto h-8 w-8 text-zinc-600" }), (0, jsx_runtime_1.jsx)("h3", { className: "mt-4 text-lg font-semibold text-zinc-100", children: "No activity yet" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-zinc-500 max-w-sm", children: "Once you start tracking payments and sending follow-ups, your activity history will appear here." })] }));
    }
    return ((0, jsx_runtime_1.jsx)(card_1.Card, { className: "bg-white/[0.02] border-white/10 overflow-hidden", children: (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "p-0", children: (0, jsx_runtime_1.jsx)("ul", { className: "divide-y divide-white/5", children: events.map((event) => {
                    const isPayment = event.event_type === "payment";
                    const customerName = event.clients?.name || event.invoices?.recipient_name || "Unknown Customer";
                    return ((0, jsx_runtime_1.jsx)("li", { className: "p-4 hover:bg-white/[0.02] transition-colors", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: `mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${isPayment ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-blue-500/20 bg-blue-500/10 text-blue-500"}`, children: isPayment ? (0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "h-4 w-4" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Send, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 space-y-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-zinc-200", children: isPayment ? "Payment Logged" : "Follow-up Sent" }), (0, jsx_runtime_1.jsx)("time", { dateTime: event.created_at, className: "text-xs text-zinc-500", children: (0, date_fns_1.formatDistanceToNow)(new Date(event.created_at), { addSuffix: true }) })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-400", children: isPayment ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: ["Recorded a payment of ", (0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-zinc-300", children: formatCurrency(event.amount || 0) }), " from", " ", (0, jsx_runtime_1.jsx)(link_1.default, { href: `/customers/${event.customer_id}`, className: "text-primary hover:underline", children: customerName })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: ["Followed up with", " ", (0, jsx_runtime_1.jsx)(link_1.default, { href: `/customers/${event.customer_id}`, className: "text-primary hover:underline", children: customerName }), " ", "via ", (0, jsx_runtime_1.jsx)("span", { className: "capitalize", children: event.followup_method || "email" })] })) }), (event.note || event.payment_source || event.followup_outcome) && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-2 flex flex-wrap gap-2 pt-2", children: [event.payment_source && ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "muted", className: "text-xs font-normal", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CreditCard, { className: "mr-1 h-3 w-3" }), event.payment_source] })), event.followup_method === "email" && ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "muted", className: "text-xs font-normal", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "mr-1 h-3 w-3" }), "Email"] })), event.followup_method === "phone" && ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "muted", className: "text-xs font-normal", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "mr-1 h-3 w-3" }), "Phone"] })), event.followup_method === "whatsapp" && ((0, jsx_runtime_1.jsxs)(badge_1.Badge, { variant: "muted", className: "text-xs font-normal", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageCircle, { className: "mr-1 h-3 w-3" }), "WhatsApp"] })), event.followup_outcome && ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: event.followup_outcome === "promise_made" ? "success" : "muted", className: "text-xs font-normal capitalize", children: event.followup_outcome.replace(/_/g, " ") })), event.note && ((0, jsx_runtime_1.jsxs)("p", { className: "text-sm italic text-zinc-500 w-full mt-1 border-l-2 border-white/10 pl-3", children: ["\"", event.note, "\""] }))] }))] })] }) }, event.id));
                }) }) }) }));
}
