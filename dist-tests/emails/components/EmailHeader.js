"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailHeader = EmailHeader;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const styles_1 = require("@/emails/components/styles");
function EmailHeader({ appUrl, eyebrow }) {
    const normalizedAppUrl = appUrl.replace(/\/+$/, "");
    return ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: header, children: [(0, jsx_runtime_1.jsxs)(components_1.Link, { href: normalizedAppUrl, style: brandLink, children: [(0, jsx_runtime_1.jsx)(components_1.Img, { src: `${appUrl}/logo.svg`, width: "24", height: "24", alt: "Duely", style: logo }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: brandName, children: "Duely" })] }), eyebrow ? (0, jsx_runtime_1.jsx)(components_1.Text, { style: eyebrowStyle, children: eyebrow }) : null] }));
}
const header = {
    padding: "0 0 22px",
};
const brandLink = {
    display: "inline-block",
    textDecoration: "none",
};
const logo = {
    display: "inline-block",
    margin: "0 9px 0 0",
    verticalAlign: "middle",
    width: "31px",
};
const brandName = {
    color: styles_1.colors.text,
    display: "inline-block",
    fontFamily: styles_1.fontFamily,
    fontSize: "16px",
    fontWeight: "700",
    letterSpacing: "-0.02em",
    lineHeight: "22px",
    margin: "0",
    verticalAlign: "middle",
};
const eyebrowStyle = {
    color: styles_1.colors.softText,
    fontFamily: styles_1.fontFamily,
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.16em",
    lineHeight: "18px",
    margin: "18px 0 0",
    textTransform: "uppercase",
};
