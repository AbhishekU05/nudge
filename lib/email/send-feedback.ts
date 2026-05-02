import "server-only";

import { createElement } from "react";

import { FeedbackNotificationEmail } from "@/emails/feedback-notification";
import { getAppUrl } from "@/lib/email/reminder";
import { getFromEmail, getResendClient } from "@/lib/resend";

type SendFeedbackEmailParams = {
  userEmail: string;
  message: string;
};

export async function sendFeedbackEmail(params: SendFeedbackEmailParams) {
  const resend = getResendClient();
  const feedbackEmail = "support@nudgepay.co.in";

  const payload = {
    from: getFromEmail(),
    to: feedbackEmail,
    subject: `New Feedback from ${params.userEmail}`,
    react: createElement(FeedbackNotificationEmail, {
      appUrl: getAppUrl(),
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
