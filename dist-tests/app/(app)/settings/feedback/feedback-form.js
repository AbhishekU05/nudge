"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackForm = FeedbackForm;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const actions_1 = require("./actions");
const button_1 = require("@/components/ui/button");
const textarea_1 = require("@/components/ui/textarea");
const lucide_react_1 = require("lucide-react");
const sonner_1 = require("sonner");
function FeedbackForm() {
    const [isPending, startTransition] = (0, react_1.useTransition)();
    const formRef = (0, react_1.useRef)(null);
    const handleSubmit = (formData) => {
        startTransition(async () => {
            try {
                await (0, actions_1.submitFeedback)(formData);
                sonner_1.toast.success("Feedback sent successfully! Thank you.");
                formRef.current?.reset();
            }
            catch (err) {
                sonner_1.toast.error(err.message || "Failed to send feedback.");
            }
        });
    };
    return ((0, jsx_runtime_1.jsxs)("form", { ref: formRef, action: handleSubmit, className: "space-y-4 max-w-xl", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "message", className: "text-sm font-medium text-zinc-200", children: "Your Feedback" }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { id: "message", name: "message", placeholder: "Tell us what's on your mind... Ideas, bugs, or just saying hi!", required: true, className: "min-h-[150px] resize-y" })] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", disabled: isPending, children: [isPending && (0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Send Feedback"] })] }));
}
