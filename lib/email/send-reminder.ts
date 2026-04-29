import "server-only";

import { buildReminderEmail } from "@/lib/email/reminder";
import { getFromEmail, getResendClient } from "@/lib/resend";

type SendReminderEmailParams = {
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  amountOwed: number;
  customMessage: string | null;
  unsubscribeToken: string;
  senderEmail?: string | null;
  idempotencyKey?: string;
};

export async function sendReminderEmail(params: SendReminderEmailParams) {
  const resend = getResendClient();
  const { subject, react, text } = buildReminderEmail({
    senderName: params.senderName,
    senderEmail: params.senderEmail,
    recipientName: params.recipientName,
    amountOwed: params.amountOwed,
    customMessage: params.customMessage,
    unsubscribeToken: params.unsubscribeToken,
  });

  const payload = {
    from: getFromEmail(),
    to: params.recipientEmail,
    subject,
    react,
    text,
    replyTo: params.senderEmail ?? undefined,
  };

  const response = params.idempotencyKey
    ? await resend.emails.send(payload, {
        idempotencyKey: params.idempotencyKey,
      })
    : await resend.emails.send(payload);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data;
}
