"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.default = PaymentReceivedPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const container_1 = require("@/components/site/container");
const card_1 = require("@/components/ui/card");
const admin_1 = require("@/lib/supabase/admin");
exports.dynamic = "force-dynamic";
async function PaymentReceivedPage({ searchParams, }) {
    const { token } = await searchParams;
    if (!token) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-1 items-center", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-12", children: (0, jsx_runtime_1.jsx)(card_1.Card, { className: "mx-auto max-w-lg bg-white/[0.035]", children: (0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-200", children: (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Missing link" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "This payment confirmation link is incomplete." })] }) }) }) }));
    }
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    // Fetch the balance so we can set amount_paid and log the customer signal.
    const { data: reminder } = await supabase
        .from("invoices")
        .select("amount_owed, amount_paid, currency, user_id, customer_id")
        .eq("unsubscribe_token", token)
        .maybeSingle();
    // client_paid_at is set ONLY via this path (customer self-reporting).
    // Agent-marked payments (from the dashboard) never touch this field,
    // so it remains an unambiguous signal of who confirmed the payment.
    const { data, error } = await supabase
        .from("invoices")
        .update({
        client_paid_at: new Date().toISOString(),
        workflow_status: "paid",
        amount_paid: reminder?.amount_owed ?? 0,
        active: false,
    })
        .eq("unsubscribe_token", token)
        .select("id")
        .maybeSingle();
    const succeeded = Boolean(data) && !error;
    if (succeeded && reminder && data) {
        const remaining = Math.max(0, Number(reminder.amount_owed) - Number(reminder.amount_paid));
        if (remaining > 0) {
            await supabase.from("customer_events").insert({
                invoice_id: data.id,
                customer_id: reminder.customer_id,
                user_id: reminder.user_id,
                event_type: "payment",
                event_date: new Date().toISOString().slice(0, 10),
                amount: remaining,
                currency: reminder.currency,
                payment_source: "customer",
            });
        }
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-1 items-center", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-12", children: (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "mx-auto max-w-lg bg-white/[0.035]", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300", children: succeeded ? ((0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-5 w-5 text-emerald-200" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-5 w-5 text-red-200" })) }), (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: succeeded ? "Payment noted" : "Request failed" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: succeeded
                                    ? "Thanks. The sender will see that you marked this invoice as paid."
                                    : "We could not process this payment confirmation link." })] }), !succeeded ? ((0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "text-center text-sm text-zinc-500", children: "The link may be invalid or expired." })) : null] }) }) }));
}
