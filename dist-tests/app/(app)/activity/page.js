"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ActivityPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const container_1 = require("@/components/site/container");
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
const activity_feed_1 = require("./activity-feed");
async function ActivityPage() {
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: events, error } = await supabase
        .from("customer_events")
        .select("*, invoices(recipient_name), clients(name)")
        .order("created_at", { ascending: false })
        .limit(100);
    if (error) {
        console.error("Error fetching activity events:", error);
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex min-h-screen flex-col", children: (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-8 sm:py-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl", children: "Activity" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 max-w-2xl text-base leading-7 text-zinc-500", children: "A complete audit trail of all follow-ups and payments across your customers." })] }), (0, jsx_runtime_1.jsx)(activity_feed_1.ActivityFeed, { events: events || [] })] }) }) }));
}
