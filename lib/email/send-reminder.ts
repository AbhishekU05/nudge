import "server-only";

import { sendGmail } from "@/lib/gmail";
import { logger } from "@/lib/logger";

type SendReminderEmailParams = {
  userId: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  recipientName: string;
  emailSubject: string | null;
  customMessage: string | null;
  paymentLink: string | null;
};

/**
 * Send a plain-text payment reminder from the user's own Gmail.
 */
export async function sendReminderEmail(params: SendReminderEmailParams) {
  const safeRecipientName = params.recipientName.trim() || "there";
  const safeSenderName = params.senderName.trim() || "Someone";

  // Build the plain-text body exactly as shown in the preview
  const bodyLines: string[] = [
    `Hi ${safeRecipientName},`,
    "",
  ];

  if (params.customMessage?.trim()) {
    bodyLines.push(params.customMessage.trim());
  }

  if (params.paymentLink?.trim()) {
    bodyLines.push("", `Here's the payment link: ${params.paymentLink.trim()}`);
  }

  bodyLines.push("", "Best,", safeSenderName);

  const body = bodyLines.join("\n");
  const subject = params.emailSubject?.trim() || "Payment reminder";

  try {
    await sendGmail({
      userId: params.userId,
      senderName: safeSenderName,
      senderEmail: params.senderEmail,
      to: params.recipientEmail,
      subject,
      body,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.external({
      service: "Gmail",
      action: "send_reminder_email",
      success: false,
      error: message,
    });
    throw error;
  }
}
