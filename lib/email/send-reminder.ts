import "server-only";

import { sendGmail } from "@/lib/gmail";
import { logger } from "@/lib/logger";

type SendReminderEmailParams = {
  userId: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  recipientName: string;
  customMessage: string | null;
};

/**
 * Send a plain-text payment reminder from the user's own Gmail.
 *
 * Format:
 *   Hey [client name],
 *
 *   [follow-up message]
 *
 *   [user's name]
 */
export async function sendReminderEmail(params: SendReminderEmailParams) {
  const safeRecipientName = params.recipientName.trim() || "there";
  const safeSenderName = params.senderName.trim() || "Someone";

  // Build the plain-text body
  const bodyLines: string[] = [
    `Hey ${safeRecipientName},`,
  ];

  if (params.customMessage?.trim()) {
    bodyLines.push("", params.customMessage.trim());
  }

  bodyLines.push("", safeSenderName);

  const body = bodyLines.join("\n");
  const subject = "Following up";

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
