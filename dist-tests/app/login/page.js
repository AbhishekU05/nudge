"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginPage;
const jsx_runtime_1 = require("react/jsx-runtime");
/*
 * login page
 */
const link_1 = __importDefault(require("next/link"));
const auth_1 = require("@/app/actions/auth");
const auth_shell_1 = require("@/components/site/auth-shell");
const google_auth_button_1 = require("@/components/site/google-auth-button");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const auth_providers_1 = require("@/lib/auth-providers");
const paths_1 = require("@/lib/paths");
// main function for login page
async function LoginPage({ searchParams, }) {
    const { error, next, success } = await searchParams;
    const nextPath = (0, paths_1.getSafeNextPath)(next, "/dashboard");
    const signupHref = (0, paths_1.buildPathWithQuery)("/signup", {
        next: nextPath !== "/dashboard" ? nextPath : null,
    });
    const googleAuthEnabled = (0, auth_providers_1.isGoogleAuthEnabled)();
    return ((0, jsx_runtime_1.jsxs)(auth_shell_1.AuthShell, { title: "Welcome back.", description: "Sign in to your Duely account.", children: [(0, jsx_runtime_1.jsxs)("form", { action: auth_1.login, className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "next", value: nextPath }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "email", children: "Email" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "email", name: "email", type: "email", placeholder: "e.g., alex@agency.com", required: true }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500", children: "Use your work email to automatically join your company's workspace." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "password", children: "Password" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/forgot-password", className: "text-xs font-medium text-zinc-500 underline underline-offset-4 hover:text-zinc-200", children: "Forgot password?" })] }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "password", name: "password", type: "password", required: true })] }), success ? ((0, jsx_runtime_1.jsx)("p", { className: "rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200", children: success })) : null, error ? ((0, jsx_runtime_1.jsx)("p", { className: "rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200", role: "alert", children: error })) : null, (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", className: "w-full", children: "Sign in" })] }), googleAuthEnabled ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "mt-5 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10", children: (0, jsx_runtime_1.jsx)("span", { className: "text-xs uppercase tracking-wider text-zinc-500", children: "or" }) }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4", children: (0, jsx_runtime_1.jsx)(google_auth_button_1.GoogleAuthButton, { nextPath: nextPath, children: "Log in with Google" }) })] })) : null, (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 text-center text-sm text-zinc-500", children: ["Don\u2019t have an account?", " ", (0, jsx_runtime_1.jsx)(link_1.default, { href: signupHref, className: "font-medium text-zinc-100 underline underline-offset-4 hover:text-white", children: "Sign up" })] })] }));
}
