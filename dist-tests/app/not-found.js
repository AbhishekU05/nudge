"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NotFound;
const jsx_runtime_1 = require("react/jsx-runtime");
const site_header_1 = require("@/components/site/site-header");
const site_footer_1 = require("@/components/site/site-footer");
const link_1 = __importDefault(require("next/link"));
const container_1 = require("@/components/site/container");
const button_1 = require("@/components/ui/button");
function NotFound() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex min-h-screen flex-col", children: [(0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex flex-1 items-center justify-center", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-16 text-center sm:py-24", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-7xl font-semibold tracking-[-0.045em] text-zinc-50 sm:text-8xl", children: "404" }), (0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-medium tracking-tight text-zinc-200 sm:text-3xl", children: "Page not found" }), (0, jsx_runtime_1.jsx)("p", { className: "mx-auto max-w-md text-base leading-7 text-zinc-400", children: "The page you are looking for doesn't exist or has been moved. Let's get you back on track." }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-center gap-3 pt-4", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/", children: (0, jsx_runtime_1.jsx)(button_1.Button, { size: "lg", children: "Go home" }) }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/dashboard", children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "secondary", size: "lg", children: "View dashboard" }) })] })] }) }) }), (0, jsx_runtime_1.jsx)(site_footer_1.SiteFooter, {})] }));
}
