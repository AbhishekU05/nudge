"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MagicLinkEmail = MagicLinkEmail;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const EmailButton_1 = require("@/emails/components/EmailButton");
const EmailCard_1 = require("@/emails/components/EmailCard");
const EmailLayout_1 = require("@/emails/components/EmailLayout");
const Typography_1 = require("@/emails/components/Typography");
function MagicLinkEmail({ actionUrl, appUrl, userEmail, }) {
    return ((0, jsx_runtime_1.jsx)(EmailLayout_1.EmailLayout, { appUrl: appUrl, eyebrow: "Secure sign-in", preview: "Use this link to sign in to Duely.", children: (0, jsx_runtime_1.jsxs)(EmailCard_1.EmailCard, { children: [(0, jsx_runtime_1.jsx)(Typography_1.EmailHeading, { children: "Sign in" }), (0, jsx_runtime_1.jsx)(Typography_1.EmailText, { children: "Use the secure link below to open your dashboard. The link is for one-time use and should only be opened by you." }), userEmail ? ((0, jsx_runtime_1.jsxs)(Typography_1.EmailMutedText, { children: ["This sign-in link was requested for ", userEmail, "."] })) : null, (0, jsx_runtime_1.jsx)(components_1.Section, { style: ctaSection, children: (0, jsx_runtime_1.jsx)(EmailButton_1.EmailButton, { href: actionUrl, children: "Open Duely" }) }), (0, jsx_runtime_1.jsx)(Typography_1.EmailMutedText, { children: "If you did not request this link, please ignore this message." })] }) }));
}
const ctaSection = {
    margin: "24px 0 18px",
};
