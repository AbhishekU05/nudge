"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetEmail = PasswordResetEmail;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const EmailButton_1 = require("@/emails/components/EmailButton");
const EmailCard_1 = require("@/emails/components/EmailCard");
const EmailLayout_1 = require("@/emails/components/EmailLayout");
const Typography_1 = require("@/emails/components/Typography");
function PasswordResetEmail({ actionUrl, appUrl, userEmail, }) {
    return ((0, jsx_runtime_1.jsx)(EmailLayout_1.EmailLayout, { appUrl: appUrl, eyebrow: "Password reset", preview: "Use this link to reset your Duely password.", children: (0, jsx_runtime_1.jsxs)(EmailCard_1.EmailCard, { children: [(0, jsx_runtime_1.jsx)(Typography_1.EmailHeading, { children: "Reset your password" }), (0, jsx_runtime_1.jsx)(Typography_1.EmailText, { children: "We received a request to reset your password. Use the link below to choose a new password." }), userEmail ? ((0, jsx_runtime_1.jsxs)(Typography_1.EmailMutedText, { children: ["This reset link was requested for ", userEmail, "."] })) : null, (0, jsx_runtime_1.jsx)(components_1.Section, { style: ctaSection, children: (0, jsx_runtime_1.jsx)(EmailButton_1.EmailButton, { href: actionUrl, children: "Reset password" }) }), (0, jsx_runtime_1.jsx)(Typography_1.EmailMutedText, { children: "If you did not request this, please ignore this message." })] }) }));
}
const ctaSection = {
    margin: "24px 0 18px",
};
