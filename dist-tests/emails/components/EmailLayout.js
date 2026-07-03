"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailLayout = EmailLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const EmailFooter_1 = require("@/emails/components/EmailFooter");
const EmailHeader_1 = require("@/emails/components/EmailHeader");
const styles_1 = require("@/emails/components/styles");
function EmailLayout({ appUrl, children, footer, preview, unsubscribeUrl, eyebrow, }) {
    return ((0, jsx_runtime_1.jsxs)(components_1.Html, { children: [(0, jsx_runtime_1.jsx)(components_1.Head, {}), (0, jsx_runtime_1.jsx)(components_1.Preview, { children: preview }), (0, jsx_runtime_1.jsx)(components_1.Body, { style: body, children: (0, jsx_runtime_1.jsxs)(components_1.Container, { style: container, children: [(0, jsx_runtime_1.jsx)(EmailHeader_1.EmailHeader, { appUrl: appUrl, eyebrow: eyebrow }), children, (0, jsx_runtime_1.jsx)(EmailFooter_1.EmailFooter, { appUrl: appUrl, unsubscribeUrl: unsubscribeUrl, children: footer })] }) })] }));
}
const body = {
    backgroundColor: styles_1.colors.background,
    fontFamily: styles_1.fontFamily,
    margin: "0",
    padding: "0",
};
const container = {
    margin: "0 auto",
    maxWidth: "600px",
    padding: "42px 20px",
};
