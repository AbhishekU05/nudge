"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = ToolPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const calculator_1 = require("./calculator");
const site_header_1 = require("@/components/site/site-header");
const site_footer_1 = require("@/components/site/site-footer");
const container_1 = require("@/components/site/container");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
exports.metadata = {
    title: "Free Payment Terms Generator for Freelancers | Duely",
    description: "Generate professional payment terms for your freelance contracts or invoices based on project type and industry.",
    alternates: {
        canonical: "/tools/payment-terms-generator",
    },
    openGraph: {
        title: "Free Payment Terms Generator for Freelancers | Duely",
        description: "Generate professional payment terms for your freelance contracts or invoices based on project type and industry.",
        url: "https://duely.in/tools/payment-terms-generator",
        type: "website",
    }
};
function ToolPage() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 flex-col overflow-x-hidden", children: [(0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1 pb-24 pt-16 sm:pb-32 sm:pt-24 lg:pb-40 bg-background", children: (0, jsx_runtime_1.jsxs)(container_1.Container, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-2xl text-center mb-12", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl", children: "Free Payment Terms Generator for Freelancers" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-6 text-lg text-zinc-400", children: "Clear payment terms prevent late payments before they happen. Use this tool to generate air-tight payment terms you can copy and paste into your next contract or invoice." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-3xl", children: [(0, jsx_runtime_1.jsx)(calculator_1.PaymentTermsGenerator, {}), (0, jsx_runtime_1.jsx)("div", { className: "mt-12 text-center p-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5", children: (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/signup", className: "inline-flex items-center text-lg font-medium text-indigo-400 hover:text-indigo-300 transition-colors", children: ["Save your results and track outstanding invoices in Duely ", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "ml-2 h-5 w-5" })] }) })] })] }) }), (0, jsx_runtime_1.jsx)(site_footer_1.SiteFooter, {})] }));
}
