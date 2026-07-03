"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = FeedbackPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const auth_1 = require("@/lib/auth");
const feedback_form_1 = require("./feedback-form");
exports.metadata = {
    title: "Feedback | Duely",
};
async function FeedbackPage() {
    await (0, auth_1.requireUser)();
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-medium text-zinc-100", children: "Feedback" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-zinc-400", children: "We'd love to hear from you. Please let us know if you have any suggestions, found a bug, or need a new feature!" })] }), (0, jsx_runtime_1.jsx)("div", { className: "rounded-xl border border-white/10 bg-white/[0.02] p-6", children: (0, jsx_runtime_1.jsx)(feedback_form_1.FeedbackForm, {}) })] }));
}
