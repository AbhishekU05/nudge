"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFeedbackEmail = sendFeedbackEmail;
require("server-only");
const react_1 = require("react");
const feedback_notification_1 = require("@/emails/feedback-notification");
const reminder_1 = require("@/lib/email/reminder");
const resend_1 = require("@/lib/resend");
async function sendFeedbackEmail(params) {
    const resend = (0, resend_1.getResendClient)();
    const feedbackEmail = "support@duely.in";
    const payload = {
        from: (0, resend_1.getFromEmail)(),
        to: feedbackEmail,
        subject: `New Feedback from ${params.userEmail}`,
        react: (0, react_1.createElement)(feedback_notification_1.FeedbackNotificationEmail, {
            appUrl: (0, reminder_1.getAppUrl)(),
            message: params.message,
            userEmail: params.userEmail,
        }),
        text: `User: ${params.userEmail}\n\nFeedback:\n${params.message}`,
    };
    const response = await resend.emails.send(payload);
    if (response.error) {
        throw new Error(response.error.message);
    }
    return response.data;
}
