"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = Button;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_dom_1 = require("react-dom");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
function Button({ className, variant = "primary", size = "md", type, disabled, children, ...props }) {
    const { pending } = (0, react_dom_1.useFormStatus)();
    const isPending = type === "submit" && pending;
    return ((0, jsx_runtime_1.jsxs)("button", { type: type, disabled: disabled || isPending, className: (0, utils_1.cn)("inline-flex items-center justify-center gap-2 rounded-lg border border-transparent font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45", size === "sm" && "h-8 px-3 text-xs", size === "md" && "h-10 px-4 text-sm", size === "lg" && "h-11 px-5 text-sm", variant === "primary" &&
            "bg-primary text-primary-foreground hover:bg-primary/90", variant === "secondary" &&
            "border-white/10 bg-white/[0.06] text-zinc-100 hover:bg-white/[0.1]", variant === "danger" &&
            "border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/15", variant === "ghost" &&
            "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100", className), ...props, children: [isPending && (0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "h-4 w-4 animate-spin" }), children] }));
}
