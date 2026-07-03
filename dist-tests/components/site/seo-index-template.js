"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SEOIndexTemplate;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const container_1 = require("@/components/site/container");
const site_header_1 = require("@/components/site/site-header");
const site_footer_1 = require("@/components/site/site-footer");
function SEOIndexTemplate({ title, description, links }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col min-h-screen", children: [(0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsxs)("main", { className: "flex-1 pb-24", children: [(0, jsx_runtime_1.jsxs)("section", { className: "relative pt-32 pb-16 px-6 border-b border-white/5", children: [(0, jsx_runtime_1.jsx)("div", { className: "pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(79,70,229,0.15),transparent_60%),radial-gradient(ellipse_at_80%_40%,rgba(168,85,247,0.08),transparent_50%)]" }), (0, jsx_runtime_1.jsxs)(container_1.Container, { className: "max-w-4xl", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-4xl md:text-5xl font-bold tracking-tight text-zinc-100 mb-6", children: title }), (0, jsx_runtime_1.jsx)("p", { className: "text-xl text-zinc-400 max-w-2xl", children: description })] })] }), (0, jsx_runtime_1.jsx)("section", { className: "pt-16 px-6", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "max-w-4xl", children: (0, jsx_runtime_1.jsx)("div", { className: "grid sm:grid-cols-2 gap-4", children: links.map((link, i) => ((0, jsx_runtime_1.jsxs)(link_1.default, { href: link.href, className: "group block p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-lg font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors flex items-center gap-2", children: [link.label, (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" })] }), link.description && ((0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-zinc-400 leading-relaxed", children: link.description }))] }, i))) }) }) })] }), (0, jsx_runtime_1.jsx)(site_footer_1.SiteFooter, {})] }));
}
