"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailFooter = EmailFooter;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const styles_1 = require("@/emails/components/styles");
function EmailFooter({ appUrl, children, unsubscribeUrl, }) {
    return ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: footer, children: [(0, jsx_runtime_1.jsx)(components_1.Hr, { style: rule }), children ? (0, jsx_runtime_1.jsx)(components_1.Section, { style: footerContent, children: children }) : null, (0, jsx_runtime_1.jsx)(components_1.Text, { style: footerText, children: "Duely helps people send calm, professional payment follow-ups." }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: { ...footerText, marginTop: 12 }, children: [(0, jsx_runtime_1.jsx)(components_1.Link, { href: appUrl, style: footerLink, children: "duely.in" }), unsubscribeUrl ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("span", { style: dot, children: "\u2022" }), (0, jsx_runtime_1.jsx)(components_1.Link, { href: unsubscribeUrl, style: footerLink, children: "Unsubscribe" })] })) : null] })] }));
}
const footer = {
    padding: "24px 0 0",
};
const rule = {
    borderColor: styles_1.colors.softBorder,
    margin: "0 0 20px",
};
const footerContent = {
    margin: "0 0 16px",
};
const footerText = {
    color: styles_1.colors.softText,
    fontFamily: styles_1.fontFamily,
    fontSize: "12px",
    lineHeight: "20px",
    margin: "0 0 6px",
};
const footerLink = {
    color: styles_1.colors.muted,
    textDecoration: "underline",
    textUnderlineOffset: "3px",
};
const dot = {
    color: styles_1.colors.softText,
    margin: "0 8px",
};
