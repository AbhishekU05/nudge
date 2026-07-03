"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Badge = Badge;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("@/lib/utils");
function Badge({ className, variant = "default", ...props }) {
    return ((0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium leading-none", variant === "default" &&
            "border-primary/25 bg-primary/10 text-indigo-200", variant === "success" &&
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-200", variant === "warning" &&
            "border-amber-500/20 bg-amber-500/10 text-amber-200", variant === "muted" &&
            "border-white/10 bg-white/[0.04] text-zinc-400", variant === "danger" &&
            "border-red-500/20 bg-red-500/10 text-red-200", className), ...props }));
}
