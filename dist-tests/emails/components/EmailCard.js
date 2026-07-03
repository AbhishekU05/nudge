"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailCard = EmailCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const styles_1 = require("@/emails/components/styles");
function EmailCard({ children, padded = true }) {
    return (0, jsx_runtime_1.jsx)(components_1.Section, { style: padded ? card : cardCompact, children: children });
}
const cardBase = {
    backgroundColor: styles_1.colors.card,
    border: `1px solid ${styles_1.colors.border}`,
    borderRadius: "18px",
};
const card = {
    ...cardBase,
    padding: "30px",
};
const cardCompact = {
    ...cardBase,
    padding: "0",
};
