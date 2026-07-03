"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WelcomeEmail = WelcomeEmail;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const EmailButton_1 = require("@/emails/components/EmailButton");
const EmailCard_1 = require("@/emails/components/EmailCard");
const EmailLayout_1 = require("@/emails/components/EmailLayout");
const Typography_1 = require("@/emails/components/Typography");
function WelcomeEmail({ appUrl, userName }) {
    const greeting = userName?.trim() ? `Hi ${userName.trim()},` : "Hi there,";
    return ((0, jsx_runtime_1.jsx)(EmailLayout_1.EmailLayout, { appUrl: appUrl, eyebrow: "Welcome", preview: "Your Duely account is ready.", children: (0, jsx_runtime_1.jsxs)(EmailCard_1.EmailCard, { children: [(0, jsx_runtime_1.jsx)(Typography_1.EmailHeading, { children: "Your account is ready" }), (0, jsx_runtime_1.jsx)(Typography_1.EmailText, { children: greeting }), (0, jsx_runtime_1.jsx)(Typography_1.EmailText, { children: "Welcome to Duely. You can now create payment reminders and track their status from your dashboard." }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: ctaSection, children: (0, jsx_runtime_1.jsx)(EmailButton_1.EmailButton, { href: `${appUrl.replace(/\/+$/, "")}/dashboard`, children: "Open dashboard" }) }), (0, jsx_runtime_1.jsx)(Typography_1.EmailMutedText, { children: "If you have any questions, reply to this email." })] }) }));
}
const ctaSection = {
    margin: "24px 0 18px",
};
