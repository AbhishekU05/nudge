"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentReminderEmail = PaymentReminderEmail;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const EmailButton_1 = require("@/emails/components/EmailButton");
const EmailCard_1 = require("@/emails/components/EmailCard");
const EmailLayout_1 = require("@/emails/components/EmailLayout");
const Typography_1 = require("@/emails/components/Typography");
const styles_1 = require("@/emails/components/styles");
function PaymentReminderEmail({ appUrl, amountOwed, clientPaidUrl, currency, customMessage, paymentLink, recipientName, senderEmail, senderName, unsubscribeUrl, }) {
    const safeRecipientName = recipientName.trim() || "there";
    const safeSenderName = senderName.trim() || "Someone";
    const amount = formatAmount(amountOwed, currency);
    const replyHref = senderEmail
        ? `mailto:${senderEmail}?subject=${encodeURIComponent("Re: Pending balance")}`
        : null;
    return ((0, jsx_runtime_1.jsx)(EmailLayout_1.EmailLayout, { appUrl: appUrl, eyebrow: "Payment reminder", preview: `A reminder from ${safeSenderName} about your pending balance of ${amount}.`, unsubscribeUrl: unsubscribeUrl, children: (0, jsx_runtime_1.jsxs)(EmailCard_1.EmailCard, { children: [(0, jsx_runtime_1.jsx)(Typography_1.EmailHeading, { children: "Payment reminder" }), (0, jsx_runtime_1.jsxs)(Typography_1.EmailText, { children: ["Hi ", safeRecipientName, ","] }), (0, jsx_runtime_1.jsxs)(Typography_1.EmailText, { children: ["This is a reminder that your balance to ", (0, jsx_runtime_1.jsx)("strong", { children: safeSenderName }), " is currently outstanding."] }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: summary, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: summaryLabel, children: "Pending balance" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: amountText, children: amount })] }), customMessage ? ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: note, children: [(0, jsx_runtime_1.jsxs)(Typography_1.EmailLabel, { children: ["Note from ", safeSenderName] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: noteText, children: customMessage.trim() })] })) : null, (0, jsx_runtime_1.jsx)(Typography_1.EmailMutedText, { children: "If you've already paid, please ignore this message." }), paymentLink ? ((0, jsx_runtime_1.jsx)(components_1.Section, { style: ctaSection, children: (0, jsx_runtime_1.jsx)(EmailButton_1.EmailButton, { href: paymentLink, children: "Pay now" }) })) : null, (0, jsx_runtime_1.jsx)(components_1.Section, { style: paymentLink ? secondaryCtaSection : ctaSection, children: (0, jsx_runtime_1.jsx)(EmailButton_1.EmailButton, { href: clientPaidUrl, variant: paymentLink ? "secondary" : "primary", children: "I've paid" }) }), replyHref ? ((0, jsx_runtime_1.jsx)(components_1.Section, { style: secondaryCtaSection, children: (0, jsx_runtime_1.jsxs)(EmailButton_1.EmailButton, { href: replyHref, variant: "secondary", children: ["Reply to ", safeSenderName] }) })) : null, (0, jsx_runtime_1.jsx)(components_1.Hr, { style: rule }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: finePrint, children: ["This reminder was sent by Duely on behalf of ", safeSenderName, "."] })] }) }));
}
function formatAmount(value, currency = "USD") {
    return new Intl.NumberFormat(undefined, {
        currency: currency,
        style: "currency",
    }).format(value);
}
const summary = {
    backgroundColor: "#F8F8FC",
    border: `1px solid ${styles_1.colors.softBorder}`,
    borderRadius: "14px",
    margin: "22px 0",
    padding: "18px",
};
const summaryLabel = {
    color: styles_1.colors.muted,
    fontFamily: styles_1.fontFamily,
    fontSize: "13px",
    fontWeight: "600",
    lineHeight: "18px",
    margin: "0 0 6px",
};
const amountText = {
    color: styles_1.colors.text,
    fontFamily: styles_1.fontFamily,
    fontSize: "30px",
    fontWeight: "700",
    letterSpacing: "-0.04em",
    lineHeight: "36px",
    margin: "0",
};
const note = {
    borderLeft: `3px solid ${styles_1.colors.accent}`,
    margin: "22px 0",
    padding: "2px 0 2px 14px",
};
const noteText = {
    ...styles_1.baseText,
    color: styles_1.colors.text,
    margin: "0",
};
const ctaSection = {
    margin: "24px 0 0",
};
const secondaryCtaSection = {
    margin: "12px 0 0",
};
const rule = {
    borderColor: styles_1.colors.softBorder,
    margin: "26px 0 16px",
};
const finePrint = {
    color: styles_1.colors.softText,
    fontFamily: styles_1.fontFamily,
    fontSize: "12px",
    lineHeight: "20px",
    margin: "0",
};
