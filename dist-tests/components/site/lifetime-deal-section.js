"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifetimeDealSection = LifetimeDealSection;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const leads_1 = require("@/app/actions/leads");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const scroll_animation_1 = require("@/components/site/scroll-animation");
const lucide_react_1 = require("lucide-react");
function LifetimeDealSection({ spotsLeft }) {
    const [email, setEmail] = (0, react_1.useState)("");
    const [status, setStatus] = (0, react_1.useState)("idle");
    const [isPending, startTransition] = (0, react_1.useTransition)();
    function handleSubmit(e) {
        e.preventDefault();
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setStatus("error");
            return;
        }
        startTransition(async () => {
            const res = await (0, leads_1.captureLifetimeDealLead)(trimmedEmail);
            if (res.success) {
                setStatus("success");
            }
            else if (res.error === "duplicate") {
                setStatus("duplicate");
            }
            else {
                setStatus("error");
            }
        });
    }
    return ((0, jsx_runtime_1.jsx)("section", { className: "py-12 sm:py-16", children: (0, jsx_runtime_1.jsx)("div", { className: "mx-auto max-w-4xl px-6 lg:px-8", children: (0, jsx_runtime_1.jsx)(scroll_animation_1.FadeIn, { children: (0, jsx_runtime_1.jsxs)("div", { className: "relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-background to-amber-500/5 p-8 shadow-2xl sm:p-12", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_50%)]" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-8 lg:grid-cols-[1fr_400px] lg:items-center", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-300", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { className: "h-4 w-4" }), "Founding Member Deal"] }), (0, jsx_runtime_1.jsx)("h3", { className: "mt-6 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl", children: "Lock In Lifetime Access" }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4 flex items-baseline text-4xl font-semibold text-zinc-50", children: ["$199", (0, jsx_runtime_1.jsx)("span", { className: "ml-2 text-lg font-normal text-zinc-400", children: "one-time" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-lg text-zinc-300", children: "Pay once. Get paid faster. Forever." }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 flex items-center gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex -space-x-1", children: [[...Array(5)].map((_, i) => ((0, jsx_runtime_1.jsx)("div", { className: `h-2.5 w-2.5 rounded-full border border-black ${i < spotsLeft ? "bg-amber-400" : "bg-white/10"}` }, i))), [...Array(5)].map((_, i) => ((0, jsx_runtime_1.jsx)("div", { className: `h-2.5 w-2.5 rounded-full border border-black ${i + 5 < spotsLeft ? "bg-amber-400" : "bg-white/10"}` }, i + 5)))] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-medium text-amber-200", children: [spotsLeft, " spots remaining"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm", children: status === "success" ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center space-y-3 py-4 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-6 w-6" }) }), (0, jsx_runtime_1.jsx)("p", { className: "font-medium text-emerald-300", children: "You're on the list." }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-400", children: "Check your inbox shortly." })] })) : status === "duplicate" ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center space-y-3 py-4 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-6 w-6" }) }), (0, jsx_runtime_1.jsx)("p", { className: "font-medium text-blue-300", children: "You're already on the list." }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-400", children: "We'll be in touch." })] })) : ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "flex flex-col space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(input_1.Input, { type: "email", placeholder: "Your work email", value: email, onChange: (e) => {
                                                            setEmail(e.target.value);
                                                            if (status === "error")
                                                                setStatus("idle");
                                                        }, className: "h-12 border-white/10 bg-white/[0.03] text-base", required: true, disabled: isPending }), status === "error" && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-400", children: "Please enter a valid email address." }))] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", size: "lg", disabled: isPending || spotsLeft <= 0, className: "h-12 w-full bg-amber-500 text-zinc-950 hover:bg-amber-400", children: [spotsLeft <= 0 ? "Sold out" : "Claim your spot", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "ml-2 h-4 w-4" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-center text-xs text-zinc-500", children: "We'll send you a payment link within a few hours." })] })) })] })] }) }) }) }));
}
