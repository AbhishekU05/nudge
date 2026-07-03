"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Textarea = Textarea;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("@/lib/utils");
function Textarea({ className, ...props }) {
    return ((0, jsx_runtime_1.jsx)("textarea", { className: (0, utils_1.cn)("min-h-28 w-full rounded-lg border border-border bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-primary/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-45", className), ...props }));
}
