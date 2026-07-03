"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReminderEmail = sendReminderEmail;
require("server-only");
const gmail_1 = require("@/lib/gmail");
const resend_1 = require("@/lib/resend");
const logger_1 = require("@/lib/logger");
/**
 * Send a payment reminder email.
 *
 * Routing logic:
 * 1. If the user has Gmail tokens stored → send from their Gmail via API.
 * 2. Otherwise → send via Resend from reminders@duely.in with
 *    the sender name displayed as "Alex Chen via Duely".
 */
async function sendReminderEmail(params) {
    const safeRecipientName = params.recipientName.trim() || "there";
    const safeSenderName = params.senderName.trim() || "Someone";
    const subject = params.emailSubject?.trim() || "Payment reminder";
    // Build the plain-text body exactly as shown in the preview
    const bodyLines = [
        `Hi ${safeRecipientName},`,
        "",
    ];
    if (params.customMessage?.trim()) {
        bodyLines.push(params.customMessage.trim());
    }
    if (params.paymentLink?.trim()) {
        bodyLines.push("", `Here's the payment link: ${params.paymentLink.trim()}`);
    }
    if (params.unsubscribeToken) {
        bodyLines.push("", `View your account: https://duely.in/portal/${params.unsubscribeToken}`);
    }
    bodyLines.push("", "Best,", safeSenderName);
    const body = bodyLines.join("\n");
    // ── Decide sending path ──────────────────────────────────────
    const gmailAvailable = await (0, gmail_1.hasGmailTokens)(params.userId);
    if (gmailAvailable) {
        // Path A: Send from the user's own Gmail
        try {
            await (0, gmail_1.sendGmail)({
                userId: params.userId,
                senderName: safeSenderName,
                senderEmail: params.senderEmail,
                to: params.recipientEmail,
                subject,
                body,
            });
            return;
        }
        catch (error) {
            // If Gmail fails (e.g. revoked access), fall through to Resend
            const message = error instanceof Error ? error.message : "Unknown error";
            logger_1.logger.external({
                service: "Gmail",
                action: "send_reminder_email",
                success: false,
                error: message,
            });
            logger_1.logger.error({
                message: "Gmail send failed, falling back to Resend",
                context: "send_reminder_email",
                error: message,
            });
        }
    }
    // Path B: Send via Resend fallback from reminders@duely.in
    try {
        const resend = (0, resend_1.getResendClient)();
        const fromName = `${safeSenderName} via Duely`;
        const fromEmail = "reminders@duely.in";
        await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: params.recipientEmail,
            subject,
            text: body,
            replyTo: params.senderEmail || undefined,
        });
        logger_1.logger.external({
            service: "Resend",
            action: "send_reminder_email",
            success: true,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logger_1.logger.external({
            service: "Resend",
            action: "send_reminder_email",
            success: false,
            error: message,
        });
        throw error;
    }
}
