"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SignupPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const auth_1 = require("@/app/actions/auth");
const auth_shell_1 = require("@/components/site/auth-shell");
const google_auth_button_1 = require("@/components/site/google-auth-button");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const auth_providers_1 = require("@/lib/auth-providers");
const paths_1 = require("@/lib/paths");
async function SignupPage({ searchParams, }) {
    const { email, error, next } = await searchParams;
    const nextPath = (0, paths_1.getSafeNextPath)(next, "/dashboard");
    const initialEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const loginHref = (0, paths_1.buildPathWithQuery)("/login", {
        next: nextPath !== "/dashboard" ? nextPath : null,
    });
    const googleAuthEnabled = (0, auth_providers_1.isGoogleAuthEnabled)();
    return ((0, jsx_runtime_1.jsxs)(auth_shell_1.AuthShell, { title: "Create your account.", description: "Start tracking invoices and getting paid on time.", children: [(0, jsx_runtime_1.jsxs)("form", { action: auth_1.signup, className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("input", { type: "hidden", name: "next", value: nextPath }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "full_name", children: "Full name" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "full_name", name: "full_name", type: "text", placeholder: "e.g., Alex Rivera", required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "email", children: "Email" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "email", name: "email", type: "email", placeholder: "e.g., alex@agency.com", defaultValue: initialEmail, required: true }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500", children: "Use your work email to automatically join your company's workspace." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "password", children: "Password" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "password", name: "password", type: "password", minLength: 8, required: true }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500", children: "At least 8 characters" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "confirm_password", children: "Confirm Password" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "confirm_password", name: "confirm_password", type: "password", minLength: 8, required: true })] }), error ? ((0, jsx_runtime_1.jsx)("p", { className: "rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200", role: "alert", children: error })) : null, (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", className: "w-full", children: "Create account" })] }), googleAuthEnabled ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "mt-5 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10", children: (0, jsx_runtime_1.jsx)("span", { className: "text-xs uppercase tracking-wider text-zinc-500", children: "or" }) }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4", children: (0, jsx_runtime_1.jsx)(google_auth_button_1.GoogleAuthButton, { nextPath: nextPath, children: "Sign up with Google" }) })] })) : null, (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 text-center text-sm text-zinc-500", children: ["Already have an account?", " ", (0, jsx_runtime_1.jsx)(link_1.default, { href: loginHref, className: "font-medium text-zinc-100 underline underline-offset-4 hover:text-white", children: "Log in" })] })] }));
}
