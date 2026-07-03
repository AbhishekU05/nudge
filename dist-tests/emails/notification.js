"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationEmail = NotificationEmail;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const EmailButton_1 = require("@/emails/components/EmailButton");
const EmailCard_1 = require("@/emails/components/EmailCard");
const EmailLayout_1 = require("@/emails/components/EmailLayout");
const Typography_1 = require("@/emails/components/Typography");
function NotificationEmail({ actionLabel, actionUrl, appUrl, body, preview, title, }) {
    return ((0, jsx_runtime_1.jsx)(EmailLayout_1.EmailLayout, { appUrl: appUrl, eyebrow: "Notification", preview: preview ?? title, children: (0, jsx_runtime_1.jsxs)(EmailCard_1.EmailCard, { children: [(0, jsx_runtime_1.jsx)(Typography_1.EmailHeading, { children: title }), (0, jsx_runtime_1.jsx)(Typography_1.EmailText, { children: body }), actionUrl && actionLabel ? ((0, jsx_runtime_1.jsx)(components_1.Section, { style: ctaSection, children: (0, jsx_runtime_1.jsx)(EmailButton_1.EmailButton, { href: actionUrl, children: actionLabel }) })) : ((0, jsx_runtime_1.jsx)(Typography_1.EmailMutedText, { children: "No action is required." }))] }) }));
}
const ctaSection = {
    margin: "24px 0 0",
};
