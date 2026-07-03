"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminDashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
async function AdminDashboard() {
    // Use admin client to bypass RLS in the admin dashboard
    const { createSupabaseAdminClient } = await Promise.resolve().then(() => __importStar(require("@/lib/supabase/admin")));
    const supabase = createSupabaseAdminClient();
    const [{ count: orgCount }, { count: usersCount }, { count: webhooksCount }] = await Promise.all([
        supabase.from("organizations").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("webhook_events").select("*", { count: "exact", head: true }),
    ]);
    const stats = [
        { name: "Total Organizations", value: orgCount || 0, icon: lucide_react_1.Users, href: "/admin/organizations" },
        { name: "Total Users", value: usersCount || 0, icon: lucide_react_1.Users, href: "#" },
        { name: "Active Subscriptions", value: "N/A", icon: lucide_react_1.CreditCard, href: "/admin/organizations" },
        { name: "Webhook Events", value: webhooksCount || 0, icon: lucide_react_1.Activity, href: "/admin/webhooks" },
    ];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold text-gray-900", children: "Platform Overview" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: stats.map((stat) => ((0, jsx_runtime_1.jsx)(link_1.default, { href: stat.href, className: "block group", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow hover:shadow-md", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-between mb-4", children: (0, jsx_runtime_1.jsx)("div", { className: "p-2 bg-gray-50 rounded-lg text-gray-600 group-hover:bg-black group-hover:text-white transition-colors", children: (0, jsx_runtime_1.jsx)(stat.icon, { size: 24 }) }) }), (0, jsx_runtime_1.jsx)("h3", { className: "text-gray-500 text-sm font-medium", children: stat.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-3xl font-bold text-gray-900 mt-1", children: stat.value })] }) }, stat.name))) }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8 bg-white border border-gray-200 rounded-xl shadow-sm p-6", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-lg font-semibold mb-4 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "text-amber-500", size: 20 }), "System Health"] }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 text-sm mb-4", children: "All core systems are operational. Monitor incoming webhook events to detect any ingestion failures from Dodo Payments." }), (0, jsx_runtime_1.jsx)("div", { className: "flex gap-4", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/admin/webhooks", className: "text-sm bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors", children: "View Webhook Logs" }) })] })] }));
}
