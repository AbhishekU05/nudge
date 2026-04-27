import "server-only";

import { getFromEmail, getResendClient } from "@/lib/resend";

type SendFeedbackEmailParams = {
  userEmail: string;
  message: string;
};

export async function sendFeedbackEmail(params: SendFeedbackEmailParams) {
  const resend = getResendClient();
  const feedbackEmail = "a.upadhya05@gmail.com"; // User's verified email

  const payload = {
    from: getFromEmail(),
    to: feedbackEmail,
    subject: `New Feedback from ${params.userEmail}`,
    html: `<p><strong>User:</strong> ${params.userEmail}</p><p><strong>Feedback:</strong></p><p>${params.message.replace(/\n/g, "<br>")}</p>`,
    text: `User: ${params.userEmail}\n\nFeedback:\n${params.message}`,
  };

  const response = await resend.emails.send(payload);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data;
}
