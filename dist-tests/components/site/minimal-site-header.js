"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinimalSiteHeader = MinimalSiteHeader;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const image_1 = __importDefault(require("next/image"));
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
function MinimalSiteHeader() {
    return ((0, jsx_runtime_1.jsx)("header", { className: "sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/", className: "flex items-center gap-3 transition-opacity hover:opacity-90", children: [(0, jsx_runtime_1.jsx)(image_1.default, { src: "/logo.svg", width: 36, height: 36, alt: "Duely Logo", className: "h-9 w-9 rounded-lg shadow-sm" }), (0, jsx_runtime_1.jsx)("span", { className: "text-lg font-semibold text-zinc-50", children: "Duely" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/tools", className: "hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100 sm:inline-flex", children: "Tools" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/signup", children: (0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", className: "h-9 px-3 sm:px-4", children: [(0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: "Start Free Trial" }), (0, jsx_runtime_1.jsx)("span", { className: "inline sm:hidden", children: "Get Started" }), (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "ml-1 sm:ml-2 h-4 w-4" })] }) })] })] }) }));
}
