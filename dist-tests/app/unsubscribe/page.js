"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.default = UnsubscribePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const container_1 = require("@/components/site/container");
const card_1 = require("@/components/ui/card");
const admin_1 = require("@/lib/supabase/admin");
exports.dynamic = "force-dynamic";
async function UnsubscribePage({ searchParams, }) {
    const { token } = await searchParams;
    if (!token) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-1 items-center", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-12", children: (0, jsx_runtime_1.jsx)(card_1.Card, { className: "mx-auto max-w-lg bg-white/[0.035]", children: (0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-200", children: (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Missing link" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "This unsubscribe link is incomplete." })] }) }) }) }));
    }
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    // Set workflow_status to 'written_off' so the customer moves to the
    // "Written off" section of the pipeline \u2014 emails won\u2019t be sent to them anymore.
    const { error } = await supabase
        .from("invoices")
        .update({ unsubscribed: true, active: false, workflow_status: "written_off" })
        .eq("unsubscribe_token", token);
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-1 items-center", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-12", children: (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "mx-auto max-w-lg bg-white/[0.035]", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300", children: error ? ((0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-5 w-5 text-red-200" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-5 w-5 text-emerald-200" })) }), (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: error ? "Request failed" : "Unsubscribed" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: error
                                    ? "We could not process your request."
                                    : "You have been unsubscribed and will not receive further reminders." })] }), error ? ((0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "text-center text-sm text-zinc-500", children: "An unexpected error occurred." })) : null] }) }) }));
}
