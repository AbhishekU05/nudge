"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ResetPasswordPage;
const jsx_runtime_1 = require("react/jsx-runtime");
/*
 * reset password page
 */
const link_1 = __importDefault(require("next/link"));
const auth_1 = require("@/app/actions/auth");
const auth_shell_1 = require("@/components/site/auth-shell");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const server_1 = require("@/lib/supabase/server");
// reset password main function
async function ResetPasswordPage({ searchParams, }) {
    const { error, success } = await searchParams;
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        return ((0, jsx_runtime_1.jsx)(auth_shell_1.AuthShell, { title: "Reset link required", description: "Open the latest reset email or request a new link.", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200", role: "alert", children: "Your reset link is missing, invalid, or expired." }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/forgot-password", children: (0, jsx_runtime_1.jsx)(button_1.Button, { className: "w-full", children: "Request a new reset link" }) })] }) }));
    }
    return ((0, jsx_runtime_1.jsx)(auth_shell_1.AuthShell, { title: "Create new password", description: "Choose a strong password for your account.", children: (0, jsx_runtime_1.jsxs)("form", { action: auth_1.resetPassword, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "password", children: "New Password" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "password", name: "password", type: "password", minLength: 8, required: true }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500", children: "Use at least 8 characters." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "confirm_password", children: "Confirm New Password" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "confirm_password", name: "confirm_password", type: "password", minLength: 8, required: true })] }), success ? ((0, jsx_runtime_1.jsx)("p", { className: "rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200", children: success })) : null, error ? ((0, jsx_runtime_1.jsx)("p", { className: "rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200", role: "alert", children: error })) : null, (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", className: "w-full", children: "Update password" })] }) }));
}
