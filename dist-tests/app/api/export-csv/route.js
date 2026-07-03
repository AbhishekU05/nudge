"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = exports.runtime = void 0;
exports.GET = GET;
/* eslint-disable */
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const server_2 = require("@/lib/supabase/server");
exports.runtime = "nodejs";
exports.dynamic = "force-dynamic";
async function GET() {
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_2.createSupabaseServerClient)();
    let customers = null;
    let events = null;
    try {
        const [customersRes, eventsRes] = await Promise.all([
            supabase
                .from("invoices")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false }),
            supabase
                .from("customer_events")
                .select("*")
                .eq("user_id", user.id)
                .eq("event_type", "followup")
                .order("event_date", { ascending: false }),
        ]);
        customers = customersRes.data;
        events = eventsRes.data;
    }
    catch (error) {
        return server_1.NextResponse.json({ error: "Failed to export data" }, { status: 500 });
    }
    const followupsByCustomer = new Map();
    for (const event of events || []) {
        if (!followupsByCustomer.has(event.customer_id)) {
            followupsByCustomer.set(event.customer_id, event);
        }
    }
    const header = [
        "Client name",
        "Contact email",
        "Invoice amount",
        "Invoice date",
        "Due date",
        "Status",
        "Last follow-up date",
        "Last follow-up method",
        "Last follow-up outcome",
        "Notes",
    ];
    const escapeCSV = (val) => {
        if (val === null || val === undefined)
            return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    const rows = (customers || []).map((c) => {
        const followup = followupsByCustomer.get(c.id);
        return [
            c.recipient_name,
            c.recipient_email,
            c.amount_owed,
            c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
            c.due_date || "",
            c.workflow_status,
            followup?.event_date ? new Date(followup.event_date).toLocaleDateString() : "",
            followup?.followup_method || "",
            followup?.followup_outcome || "",
            followup?.note || "",
        ]
            .map(escapeCSV)
            .join(",");
    });
    const csvContent = [header.join(","), ...rows].join("\n");
    const today = new Date().toISOString().split("T")[0];
    const filename = `duely-export-${today}.csv`;
    return new server_1.NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
