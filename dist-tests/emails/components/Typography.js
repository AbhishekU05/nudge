"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailHeading = EmailHeading;
exports.EmailText = EmailText;
exports.EmailMutedText = EmailMutedText;
exports.EmailLabel = EmailLabel;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const styles_1 = require("@/emails/components/styles");
function EmailHeading({ children }) {
    return (0, jsx_runtime_1.jsx)(components_1.Heading, { style: heading, children: children });
}
function EmailText({ children }) {
    return (0, jsx_runtime_1.jsx)(components_1.Text, { style: paragraph, children: children });
}
function EmailMutedText({ children }) {
    return (0, jsx_runtime_1.jsx)(components_1.Text, { style: mutedParagraph, children: children });
}
function EmailLabel({ children }) {
    return (0, jsx_runtime_1.jsx)(components_1.Text, { style: label, children: children });
}
const heading = {
    color: styles_1.colors.text,
    fontFamily: styles_1.fontFamily,
    fontSize: "28px",
    fontWeight: "700",
    letterSpacing: "-0.04em",
    lineHeight: "34px",
    margin: "0 0 16px",
};
const paragraph = {
    ...styles_1.baseText,
    margin: "0 0 16px",
};
const mutedParagraph = {
    ...styles_1.mutedText,
    margin: "0 0 16px",
};
const label = {
    color: styles_1.colors.softText,
    fontFamily: styles_1.fontFamily,
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.14em",
    lineHeight: "18px",
    margin: "0 0 8px",
    textTransform: "uppercase",
};
