"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailButton = EmailButton;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const styles_1 = require("@/emails/components/styles");
function EmailButton({ children, href, variant = "primary", }) {
    return ((0, jsx_runtime_1.jsx)(components_1.Button, { href: href, style: variant === "primary" ? primaryButton : secondaryButton, children: children }));
}
const buttonBase = {
    borderRadius: "10px",
    display: "inline-block",
    fontFamily: styles_1.fontFamily,
    fontSize: "14px",
    fontWeight: "700",
    lineHeight: "20px",
    padding: "12px 18px",
    textDecoration: "none",
};
const primaryButton = {
    ...buttonBase,
    backgroundColor: styles_1.colors.accent,
    color: "#FFFFFF",
};
const secondaryButton = {
    ...buttonBase,
    backgroundColor: "#FFFFFF",
    border: `1px solid ${styles_1.colors.border}`,
    color: styles_1.colors.text,
};
