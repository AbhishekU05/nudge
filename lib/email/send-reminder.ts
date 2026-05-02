import "server-only";

import { buildReminderEmail } from "@/lib/email/reminder";
import { getFromEmail, getResendClient } from "@/lib/resend";
import { logger } from "@/lib/logger";

type SendReminderEmailParams = {
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  amountOwed: number;
  currency: string;
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
    currency: params.currency,
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

  const startTime = Date.now();
  const response = params.idempotencyKey
    ? await resend.emails.send(payload, {
        idempotencyKey: params.idempotencyKey,
      })
    : await resend.emails.send(payload);
  const latency = Date.now() - startTime;

  if (response.error) {
    logger.external({
      service: "Resend",
      action: "send_reminder_email",
      success: false,
      latency,
      error: response.error.message,
    });
    throw new Error(response.error.message);
  }

  logger.external({
    service: "Resend",
    action: "send_reminder_email",
    success: true,
    latency,
  });

  return response.data;
}
