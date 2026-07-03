"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MacWindow = MacWindow;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("@/lib/utils");
function MacWindow({ children, className, title = "Duely App", icon, shadow = "shadow-indigo-500/10", }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, utils_1.cn)("w-full rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl backdrop-blur-sm overflow-hidden flex flex-col relative", shadow, className), children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.01]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex gap-1.5", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-3 h-3 rounded-full bg-zinc-800" }), (0, jsx_runtime_1.jsx)("div", { className: "w-3 h-3 rounded-full bg-zinc-800" }), (0, jsx_runtime_1.jsx)("div", { className: "w-3 h-3 rounded-full bg-zinc-800" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4 text-xs font-medium text-zinc-600 flex items-center gap-2", children: [icon, title] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-1 overflow-hidden bg-zinc-950/40", children: children })] }));
}
