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
  currency: string;
  customMessage: string | null;
  paymentLink: string | null;
  recipientName: string;
  senderEmail?: string | null;
  senderName: string;
  unsubscribeToken: string;
}) {
  const unsubscribeUrl = buildUnsubscribeUrl(params.unsubscribeToken);
  const appUrl = getAppUrl();
  const amount = new Intl.NumberFormat(undefined, {
    currency: params.currency,
    style: "currency",
  }).format(params.amountOwed);
  const safeRecipientName = params.recipientName.trim() || "there";
  const safeSenderName = params.senderName.trim() || "Someone";

  const subject = "Payment reminder";

  const lines: string[] = [
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

  lines.push(
    "",
    "If you've already paid, please ignore this message.",
  );

  if (params.senderEmail) {
    lines.push("", `Reply to this email: ${params.senderEmail}`);
  }

  lines.push("", `Unsubscribe: ${unsubscribeUrl}`);

  const text = lines.join("\n");

  const react = createElement(PaymentReminderEmail, {
    appUrl,
    amountOwed: params.amountOwed,
    currency: params.currency,
    customMessage: params.customMessage,
    paymentLink: params.paymentLink,
    recipientName: safeRecipientName,
    senderEmail: params.senderEmail,
    senderName: safeSenderName,
    unsubscribeUrl,
  });

  return { subject, text, react, unsubscribeUrl };
}
