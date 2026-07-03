"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeroEmailCapture = HeroEmailCapture;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const leads_1 = require("@/app/actions/leads");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const lucide_react_1 = require("lucide-react");
function HeroEmailCapture({ className }) {
    const [email, setEmail] = (0, react_1.useState)("");
    const [error, setError] = (0, react_1.useState)(null);
    const [isPending, startTransition] = (0, react_1.useTransition)();
    const router = (0, navigation_1.useRouter)();
    function handleSubmit(e) {
        e.preventDefault();
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }
        startTransition(async () => {
            await (0, leads_1.captureLead)(trimmedEmail);
            const params = new URLSearchParams({ email: trimmedEmail });
            router.push(`/signup?${params.toString()}`);
        });
    }
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: className || "mt-9 max-w-md", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-2 shadow-2xl shadow-indigo-950/20 backdrop-blur sm:flex-row", children: [(0, jsx_runtime_1.jsx)("div", { className: "min-w-0 flex-1", children: (0, jsx_runtime_1.jsx)(input_1.Input, { id: "email-input", type: "email", placeholder: "you@example.com", "aria-label": "Email address", value: email, onChange: (e) => {
                                setEmail(e.target.value);
                                setError(null);
                            }, className: "h-12 border-transparent bg-transparent text-base focus:bg-white/[0.04]", required: true }) }), (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", size: "lg", disabled: isPending, className: "h-12 shrink-0 px-5 shadow-lg shadow-indigo-950/40", children: ["Get started", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4" })] })] }), error ? ((0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-red-300", role: "alert", children: error })) : ((0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-xs text-zinc-600", children: "No credit card required. You can set up your first customer after signup." }))] }));
}
