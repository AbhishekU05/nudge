"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const server_1 = require("@/lib/supabase/server");
const nudge_config_1 = require("@/nudge.config");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
async function AdminLayout({ children }) {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
        (0, navigation_1.redirect)("/login");
    }
    if (!nudge_config_1.nudgeConfig.adminEmails.includes(user.email)) {
        (0, navigation_1.redirect)("/"); // Not an admin
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex h-screen bg-gray-50", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "w-64 bg-white border-r border-gray-200", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-16 flex items-center px-6 border-b border-gray-200", children: (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/admin", className: "text-xl font-bold text-gray-900 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "bg-black text-white px-2 py-1 rounded", children: "Admin" }), nudge_config_1.nudgeConfig.appName] }) }), (0, jsx_runtime_1.jsxs)("nav", { className: "p-4 space-y-2", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/admin", className: "flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Home, { size: 18 }), " Dashboard"] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/admin/organizations", className: "flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { size: 18 }), " Organizations"] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/admin/webhooks", className: "flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { size: 18 }), " Webhooks"] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/admin/config", className: "flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { size: 18 }), " Config"] })] })] }), (0, jsx_runtime_1.jsxs)("main", { className: "flex-1 overflow-y-auto", children: [(0, jsx_runtime_1.jsxs)("header", { className: "h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-semibold text-gray-800", children: "Super Admin Console" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-sm text-gray-500", children: ["Logged in as ", user.email] })] }), (0, jsx_runtime_1.jsx)("div", { className: "p-8", children: children })] })] }));
}
