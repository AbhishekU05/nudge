"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppUrl = getAppUrl;
exports.buildUnsubscribeUrl = buildUnsubscribeUrl;
exports.buildClientPaidUrl = buildClientPaidUrl;
exports.buildReminderEmail = buildReminderEmail;
require("server-only");
const react_1 = require("react");
const payment_reminder_1 = require("@/emails/payment-reminder");
const env_1 = require("@/lib/env");
function getAppUrl() {
    return (0, env_1.getRequiredEnv)("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
}
function buildUnsubscribeUrl(unsubscribeToken) {
    return `${getAppUrl()}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
}
function buildClientPaidUrl(unsubscribeToken) {
    return `${getAppUrl()}/payment-received?token=${encodeURIComponent(unsubscribeToken)}`;
}
function buildReminderEmail(params) {
    const unsubscribeUrl = buildUnsubscribeUrl(params.unsubscribeToken);
    const clientPaidUrl = buildClientPaidUrl(params.unsubscribeToken);
    const appUrl = getAppUrl();
    const amount = new Intl.NumberFormat(undefined, {
        currency: params.currency,
        style: "currency",
    }).format(params.amountOwed);
    const safeRecipientName = params.recipientName.trim() || "there";
    const safeSenderName = params.senderName.trim() || "Someone";
    const subject = "Payment reminder";
    const lines = [
        `Hi ${safeRecipientName},`,
        "",
        `This is a reminder that your balance of ${amount} to ${safeSenderName} is currently outstanding.`,
    ];
    if (params.customMessage) {
        lines.push("", params.customMessage.trim());
    }
    if (params.paymentLink) {
        lines.push("", `Pay here: ${params.paymentLink}`);
    }
    lines.push("", `Mark this invoice as paid: ${clientPaidUrl}`);
    lines.push("", "If you've already paid, please ignore this message.");
    if (params.senderEmail) {
        lines.push("", `Reply to this email: ${params.senderEmail}`);
    }
    lines.push("", `Unsubscribe: ${unsubscribeUrl}`);
    const text = lines.join("\n");
    const react = (0, react_1.createElement)(payment_reminder_1.PaymentReminderEmail, {
        appUrl,
        amountOwed: params.amountOwed,
        currency: params.currency,
        customMessage: params.customMessage,
        clientPaidUrl,
        paymentLink: params.paymentLink,
        recipientName: safeRecipientName,
        senderEmail: params.senderEmail,
        senderName: safeSenderName,
        unsubscribeUrl,
    });
    return { subject, text, react, unsubscribeUrl };
}
