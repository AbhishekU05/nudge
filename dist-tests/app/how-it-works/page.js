"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = HowItWorks;
const jsx_runtime_1 = require("react/jsx-runtime");
const scroll_animation_1 = require("@/components/site/scroll-animation");
const mac_window_1 = require("@/components/site/mac-window");
const interactive_app_demo_1 = require("@/components/site/interactive-app-demo");
const site_header_1 = require("@/components/site/site-header");
const site_footer_1 = require("@/components/site/site-footer");
exports.metadata = {
    title: "How it works | Duely",
    description: "Take a spin through the Action Center, track aging invoices in your Pipeline, and see your true cashflow inside Analytics.",
};
function HowItWorks() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 flex-col overflow-x-hidden", children: [(0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1", children: (0, jsx_runtime_1.jsxs)("section", { className: "relative bg-zinc-950/50 pb-24 pt-12 backdrop-blur-sm sm:pb-32 sm:pt-16", children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto max-w-6xl px-6", children: (0, jsx_runtime_1.jsx)("div", { className: "mb-10 flex flex-col items-center text-center", children: (0, jsx_runtime_1.jsx)("h1", { className: "max-w-4xl text-pretty text-4xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-6xl", children: "See exactly how Duely gets you paid faster." }) }) }), (0, jsx_runtime_1.jsx)("div", { className: "w-full px-2 sm:px-4 lg:px-8 max-w-[100vw]", children: (0, jsx_runtime_1.jsx)(scroll_animation_1.FadeIn, { children: (0, jsx_runtime_1.jsx)(mac_window_1.MacWindow, { title: "Duely Interactive Tour", className: "h-[95vh] p-0 overflow-hidden shadow-2xl shadow-indigo-500/10 border-white/10", children: (0, jsx_runtime_1.jsx)(interactive_app_demo_1.InteractiveAppDemo, {}) }) }) })] }) }), (0, jsx_runtime_1.jsx)(site_footer_1.SiteFooter, {})] }));
}
