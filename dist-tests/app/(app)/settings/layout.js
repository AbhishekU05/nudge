"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const container_1 = require("@/components/site/container");
const settings_tabs_1 = require("@/components/site/settings-tabs");
function SettingsLayout({ children, }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex min-h-screen flex-col", children: (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "py-8 sm:py-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-6", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl", children: "Settings" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-base leading-7 text-zinc-500", children: "Manage your account, billing, and integrations." })] }), (0, jsx_runtime_1.jsx)(settings_tabs_1.SettingsTabs, {}), children] }) }) }));
}
