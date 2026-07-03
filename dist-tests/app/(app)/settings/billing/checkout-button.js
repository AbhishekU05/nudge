"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutButton = CheckoutButton;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
function CheckoutButton({ action, plan, variant, children, className, }) {
    const [isPending, startTransition] = (0, react_1.useTransition)();
    const [errorMsg, setErrorMsg] = (0, react_1.useState)(null);
    const handleClick = () => {
        setErrorMsg(null);
        startTransition(async () => {
            const formData = new FormData();
            if (plan)
                formData.append("plan", plan);
            try {
                const result = await action(formData);
                if (result?.error) {
                    setErrorMsg(result.error);
                }
                else if (result?.url) {
                    window.location.href = result.url;
                }
            }
            catch (err) {
                console.error("Checkout action failed:", err);
                setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
            }
        });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { type: "button", onClick: handleClick, disabled: isPending, variant: variant === "cancel" ? "secondary" : "primary", className: className, children: [variant === "annual" && (0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { className: "h-4 w-4 mr-2" }), isPending ? "Processing..." : children] }), errorMsg && ((0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-xs text-red-400 text-center", children: errorMsg }))] }));
}
