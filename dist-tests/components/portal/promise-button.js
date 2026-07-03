"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromiseButton = PromiseButton;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const portal_1 = require("@/app/actions/portal");
const lucide_react_1 = require("lucide-react");
function PromiseButton({ invoiceId, token, existingPromiseDate }) {
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const [date, setDate] = (0, react_1.useState)("");
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [success, setSuccess] = (0, react_1.useState)(false);
    if (success || existingPromiseDate) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 h-10 px-4 text-sm bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Calendar, { className: "w-4 h-4" }), "Promised by ", existingPromiseDate ? new Date(existingPromiseDate).toLocaleDateString() : new Date(date).toLocaleDateString()] }));
    }
    if (!isOpen) {
        return ((0, jsx_runtime_1.jsx)("button", { onClick: () => setIsOpen(true), className: "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 h-10 px-4 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300", children: "I'll pay by..." }));
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!date)
            return;
        setLoading(true);
        try {
            await (0, portal_1.promiseToPayAction)(invoiceId, date, token);
            setSuccess(true);
        }
        catch (error) {
            console.error(error);
            alert("Failed to submit promise. Please try again.");
        }
        finally {
            setLoading(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200", children: [(0, jsx_runtime_1.jsx)("input", { type: "date", value: date, onChange: (e) => setDate(e.target.value), min: new Date().toISOString().split("T")[0], required: true, disabled: loading, className: "h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: loading || !date, className: "inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-tight h-10 px-4 text-sm bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 disabled:opacity-50", children: loading ? (0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "w-4 h-4 animate-spin" }) : "Confirm" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setIsOpen(false), disabled: loading, className: "inline-flex items-center justify-center h-10 px-3 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100", children: "Cancel" })] }));
}
