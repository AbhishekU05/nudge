"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackNotificationEmail = FeedbackNotificationEmail;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const EmailCard_1 = require("@/emails/components/EmailCard");
const EmailLayout_1 = require("@/emails/components/EmailLayout");
const Typography_1 = require("@/emails/components/Typography");
const styles_1 = require("@/emails/components/styles");
function FeedbackNotificationEmail({ appUrl, message, userEmail, }) {
    return ((0, jsx_runtime_1.jsx)(EmailLayout_1.EmailLayout, { appUrl: appUrl, eyebrow: "Product feedback", preview: `New feedback from ${userEmail}`, children: (0, jsx_runtime_1.jsxs)(EmailCard_1.EmailCard, { children: [(0, jsx_runtime_1.jsx)(Typography_1.EmailHeading, { children: "New feedback received" }), (0, jsx_runtime_1.jsx)(Typography_1.EmailText, { children: "A Duely user sent feedback from inside the product." }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: meta, children: [(0, jsx_runtime_1.jsx)(Typography_1.EmailLabel, { children: "Sender" }), (0, jsx_runtime_1.jsx)(Typography_1.EmailMutedText, { children: userEmail })] }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: messageBox, children: [(0, jsx_runtime_1.jsx)(Typography_1.EmailLabel, { children: "Message" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: messageText, children: message })] })] }) }));
}
const meta = {
    margin: "20px 0",
};
const messageBox = {
    backgroundColor: "#F8F8FC",
    border: `1px solid ${styles_1.colors.softBorder}`,
    borderRadius: "14px",
    margin: "20px 0 0",
    padding: "18px",
};
const messageText = {
    ...styles_1.baseText,
    margin: "0",
    whiteSpace: "pre-wrap",
};
