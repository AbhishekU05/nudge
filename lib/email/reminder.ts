import "server-only";

import { createElement } from "react";

import { PaymentReminderEmail } from "@/emails/payment-reminder";
import { getRequiredEnv } from "@/lib/env";

export function getAppUrl() {
  return getRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
}

export function buildUnsubscribeUrl(unsubscribeToken: string) {
  return `${getAppUrl()}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
}

export function buildReminderEmail(params: {
  amountOwed: number;
  customMessage: string | null;
  recipientName: string;
  senderEmail?: string | null;
  senderName: string;
  unsubscribeToken: string;
}) {
  const unsubscribeUrl = buildUnsubscribeUrl(params.unsubscribeToken);
  const appUrl = getAppUrl();
  const amount = new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(params.amountOwed);
  const safeRecipientName = params.recipientName.trim() || "there";
  const safeSenderName = params.senderName.trim() || "Someone";

  const subject = "A gentle payment reminder";

  const lines: string[] = [
    `Hi ${safeRecipientName},`,
    "",
    `Just floating this back to the top of your inbox. This is a gentle automated reminder from ${safeSenderName} that your balance of ${amount} is still outstanding.`,
  ];

  if (params.customMessage) {
    lines.push("", params.customMessage.trim());
  }

  lines.push(
    "",
    "If you have already made this payment, please disregard this note.",
  );

  if (params.senderEmail) {
    lines.push("", `Reply to ${safeSenderName}: ${params.senderEmail}`);
  }

  lines.push("", `Unsubscribe: ${unsubscribeUrl}`);

  const text = lines.join("\n");

  const react = createElement(PaymentReminderEmail, {
    appUrl,
    amountOwed: params.amountOwed,
    customMessage: params.customMessage,
    recipientName: safeRecipientName,
    senderEmail: params.senderEmail,
    senderName: safeSenderName,
    unsubscribeUrl,
  });

  return { subject, text, react, unsubscribeUrl };
}
