"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ForgotPasswordPage;
const jsx_runtime_1 = require("react/jsx-runtime");
/*
 * forgot password page
 */
const link_1 = __importDefault(require("next/link"));
const auth_1 = require("@/app/actions/auth");
const auth_shell_1 = require("@/components/site/auth-shell");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
// main function for the page
async function ForgotPasswordPage({ searchParams, }) {
    const { error, success } = await searchParams;
    return ((0, jsx_runtime_1.jsxs)(auth_shell_1.AuthShell, { title: "Reset your password", description: "Enter your email to get a reset link.", children: [(0, jsx_runtime_1.jsxs)("form", { action: auth_1.requestPasswordReset, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "email", children: "Email" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "email", name: "email", type: "email", placeholder: "you@example.com", required: true })] }), success ? ((0, jsx_runtime_1.jsx)("p", { className: "rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200", children: success })) : null, error ? ((0, jsx_runtime_1.jsx)("p", { className: "rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200", role: "alert", children: error })) : null, (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", className: "w-full", children: "Send reset link" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 text-center text-sm text-zinc-500", children: ["Remember it now?", " ", (0, jsx_runtime_1.jsx)(link_1.default, { href: "/login", className: "font-medium text-zinc-100 underline underline-offset-4 hover:text-white", children: "Log in" })] })] }));
}
