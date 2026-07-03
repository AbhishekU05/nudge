"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ActionsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
const container_1 = require("@/components/site/container");
const action_engine_1 = require("@/lib/action-engine");
const types_1 = require("@/lib/types");
function formatCurrency(value, currency = "USD") {
    return new Intl.NumberFormat(undefined, {
        currency,
        style: "currency",
        maximumFractionDigits: 0,
    }).format(Number(value));
}
const actions_ui_1 = require("./actions-ui");
async function ActionsPage() {
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const [clientsRes, invoicesRes, eventsRes] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("invoices").select("*"),
        supabase.from("customer_events").select("*").eq("event_type", "followup"),
    ]);
    const clients = (clientsRes.data || []);
    const allInvoices = (invoicesRes.data || []);
    const events = (eventsRes.data || []);
    // Attach follow-up history to invoices manually so the engine can check cooldowns
    for (const inv of allInvoices) {
        if (!inv.followup_history) {
            inv.followup_history = [];
        }
        const invEvents = events.filter((e) => e.invoice_id === inv.id);
        for (const e of invEvents) {
            inv.followup_history.push({
                ...e,
                followup_date: e.event_date || e.created_at
            });
        }
    }
    const tasks = (0, action_engine_1.generateActionPlan)(clients, allInvoices);
    // Calculate max days overdue for all active invoices
    let maxOverdue = 0;
    for (const inv of allInvoices) {
        if (inv.workflow_status !== "paid" && inv.workflow_status !== "written_off" && (0, types_1.getRemainingBalance)(inv) > 0) {
            const overdue = (0, types_1.getDaysOverdue)(inv) || 0;
            if (overdue > maxOverdue)
                maxOverdue = overdue;
        }
    }
    const isAllUnder3Days = maxOverdue < 3;
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex min-h-screen flex-col", children: (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-8 sm:py-10", children: (0, jsx_runtime_1.jsx)(actions_ui_1.ActionsUI, { tasks: tasks, isAllUnder3Days: isAllUnder3Days }) }) }) }));
}
