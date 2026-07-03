"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminConfig;
const jsx_runtime_1 = require("react/jsx-runtime");
const nudge_config_1 = require("@/nudge.config");
function AdminConfig() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold text-gray-900", children: "Global Configuration" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-gray-600 text-sm", children: ["These settings are statically defined in ", (0, jsx_runtime_1.jsx)("code", { className: "bg-gray-100 px-1 py-0.5 rounded", children: "nudge.config.ts" }), ". Changes require a code deployment."] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "p-6", children: (0, jsx_runtime_1.jsx)("pre", { className: "bg-gray-50 p-4 rounded-lg text-sm text-gray-800 overflow-x-auto font-mono", children: JSON.stringify(nudge_config_1.nudgeConfig, null, 2) }) }) })] }));
}
