import "server-only";

import { getRequiredEnv } from "@/lib/env";

export function buildUnsubscribeUrl(unsubscribeToken: string) {
  const appUrl = getRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
  return `${appUrl}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
}

export function buildReminderEmail(params: {
  senderName: string;
  recipientName: string;
  amountOwed: number;
  customMessage: string | null;
  unsubscribeToken: string;
}) {
  const unsubscribeUrl = buildUnsubscribeUrl(params.unsubscribeToken);
  const amount = params.amountOwed.toFixed(2);
  const safeRecipientName = params.recipientName.trim() || "there";
  const safeSenderName = params.senderName.trim() || "Someone";

  const subject = "Following up on your pending balance";

  const lines: string[] = [
    `Hi ${safeRecipientName},`,
    "",
    `Just floating this to the top of your inbox. This is a gentle automated reminder from ${safeSenderName} that your balance of $${amount} is still outstanding.`,
  ];

  if (params.customMessage) {
    lines.push("", params.customMessage.trim());
  }

  lines.push(
    "",
    "If you've recently made a payment, please disregard this note!",
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  );

  const text = lines.join("\n");

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5; color: #18181b;">
      <p>Hi ${escapeHtml(safeRecipientName)},</p>
      <p>Just floating this to the top of your inbox. This is a gentle automated reminder from <strong>${escapeHtml(safeSenderName)}</strong> that your balance of <strong>$${escapeHtml(amount)}</strong> is still outstanding.</p>
      ${params.customMessage ? `<p>${escapeHtml(params.customMessage.trim())}</p>` : ""}
      <p style="color:#52525b">If you've recently made a payment, please disregard this note!</p>
      <hr style="border:0;border-top:1px solid #e4e4e7;margin:16px 0" />
      <p style="font-size:12px;color:#71717a">
        <a href="${escapeHtml(unsubscribeUrl)}" style="color:#71717a;text-decoration:underline">Unsubscribe</a>
      </p>
    </div>
  `.trim();

  return { subject, text, html, unsubscribeUrl };
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

