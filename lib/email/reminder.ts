import "server-only";

import { getRequiredEnv } from "@/lib/env";

export function buildUnsubscribeUrl(unsubscribeToken: string) {
  const appUrl = getRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
  return `${appUrl}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
}

export function buildReminderEmail(params: {
  recipientName: string;
  amountOwed: number;
  customMessage: string | null;
  unsubscribeToken: string;
}) {
  const unsubscribeUrl = buildUnsubscribeUrl(params.unsubscribeToken);
  const amount = params.amountOwed.toFixed(2);
  const safeRecipientName = params.recipientName.trim() || "there";

  const subject = "Reminder";

  const lines: string[] = [
    `Hi ${safeRecipientName},`,
    "",
    `This is a friendly reminder that $${amount} is still owed.`,
  ];

  if (params.customMessage) {
    lines.push("", params.customMessage.trim());
  }

  lines.push(
    "",
    "If you’ve already paid, you can ignore this message.",
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  );

  const text = lines.join("\n");

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5; color: #18181b;">
      <p>Hi ${escapeHtml(safeRecipientName)},</p>
      <p>This is a friendly reminder that <strong>$${escapeHtml(amount)}</strong> is still owed.</p>
      ${params.customMessage ? `<p>${escapeHtml(params.customMessage.trim())}</p>` : ""}
      <p style="color:#52525b">If you’ve already paid, you can ignore this message.</p>
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

