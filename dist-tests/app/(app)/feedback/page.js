"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FeedbackPage;
const jsx_runtime_1 = require("react/jsx-runtime");
/*
 * feedback page
 */
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const feedback_1 = require("@/app/actions/feedback");
const container_1 = require("@/components/site/container");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const textarea_1 = require("@/components/ui/textarea");
// main function for the feedback page
// TODO: change wordings
async function FeedbackPage({ searchParams, }) {
    const { error } = await searchParams;
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex min-h-screen flex-col", children: (0, jsx_runtime_1.jsx)("main", { id: "main-content", className: "flex-1", children: (0, jsx_runtime_1.jsx)(container_1.Container, { className: "py-8 sm:py-10", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-2xl", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-6", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl", children: "Share feedback" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-base leading-7 text-zinc-500", children: "What didn\u2019t work, or what would you change? Be direct. Even small issues help." })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.035]", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquareText, { className: "h-4 w-4 text-primary" }), "Message"] }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "We read everything." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("form", { action: feedback_1.submitFeedback, className: "space-y-4", children: [(0, jsx_runtime_1.jsx)(textarea_1.Textarea, { name: "message", placeholder: "Tell us what felt confusing, slow, or missing...", rows: 7, required: true, maxLength: 2000 }), error ? ((0, jsx_runtime_1.jsx)("p", { className: "rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200", role: "alert", children: error })) : null, (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/dashboard", children: (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "secondary", className: "w-full sm:w-auto", children: "Cancel" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", className: "w-full sm:w-auto", children: "Submit feedback" })] })] }) })] })] }) }) }) }));
}
