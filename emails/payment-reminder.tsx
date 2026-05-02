import { Hr, Section, Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/EmailButton";
import { EmailCard } from "@/emails/components/EmailCard";
import { EmailLayout } from "@/emails/components/EmailLayout";
import {
  EmailHeading,
  EmailLabel,
  EmailMutedText,
  EmailText,
} from "@/emails/components/Typography";
import { baseText, colors, fontFamily } from "@/emails/components/styles";

export type PaymentReminderEmailProps = {
  appUrl: string;
  amountOwed: number;
  currency: string;
  customMessage: string | null;
  recipientName: string;
  senderEmail?: string | null;
  senderName: string;
  unsubscribeUrl: string;
};

export function PaymentReminderEmail({
  appUrl,
  amountOwed,
  currency,
  customMessage,
  recipientName,
  senderEmail,
  senderName,
  unsubscribeUrl,
}: PaymentReminderEmailProps) {
  const safeRecipientName = recipientName.trim() || "there";
  const safeSenderName = senderName.trim() || "Someone";
  const amount = formatAmount(amountOwed, currency);
  const replyHref = senderEmail
    ? `mailto:${senderEmail}?subject=${encodeURIComponent("Re: Pending balance")}`
    : null;

  return (
    <EmailLayout
      appUrl={appUrl}
      eyebrow="Payment reminder"
      preview={`A gentle follow-up from ${safeSenderName} about ${amount}.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <EmailCard>
        <EmailHeading>A gentle payment follow-up</EmailHeading>
        <EmailText>Hi {safeRecipientName},</EmailText>
        <EmailText>
          Just floating this back to the top of your inbox. This is a gentle
          automated reminder from <strong>{safeSenderName}</strong> that the
          balance below is still outstanding.
        </EmailText>

        <Section style={summary}>
          <Text style={summaryLabel}>Pending balance</Text>
          <Text style={amountText}>{amount}</Text>
        </Section>

        {customMessage ? (
          <Section style={note}>
            <EmailLabel>Note from {safeSenderName}</EmailLabel>
            <Text style={noteText}>{customMessage.trim()}</Text>
          </Section>
        ) : null}

        <EmailMutedText>
          If you have already made this payment, please disregard this note.
        </EmailMutedText>

        {replyHref ? (
          <Section style={ctaSection}>
            <EmailButton href={replyHref}>Reply to {safeSenderName}</EmailButton>
          </Section>
        ) : null}

        <Hr style={rule} />
        <Text style={finePrint}>
          This reminder was sent by Nudge on behalf of {safeSenderName}. It is
          intended as a professional follow-up, not a collections notice.
        </Text>
      </EmailCard>
    </EmailLayout>
  );
}

function formatAmount(value: number, currency: string = "USD") {
  return new Intl.NumberFormat(undefined, {
    currency: currency,
    style: "currency",
  }).format(value);
}

const summary = {
  backgroundColor: "#F8F8FC",
  border: `1px solid ${colors.softBorder}`,
  borderRadius: "14px",
  margin: "22px 0",
  padding: "18px",
};

const summaryLabel = {
  color: colors.muted,
  fontFamily,
  fontSize: "13px",
  fontWeight: "600",
  lineHeight: "18px",
  margin: "0 0 6px",
};

const amountText = {
  color: colors.text,
  fontFamily,
  fontSize: "30px",
  fontWeight: "700",
  letterSpacing: "-0.04em",
  lineHeight: "36px",
  margin: "0",
};

const note = {
  borderLeft: `3px solid ${colors.accent}`,
  margin: "22px 0",
  padding: "2px 0 2px 14px",
};

const noteText = {
  ...baseText,
  color: colors.text,
  margin: "0",
};

const ctaSection = {
  margin: "24px 0 0",
};

const rule = {
  borderColor: colors.softBorder,
  margin: "26px 0 16px",
};

const finePrint = {
  color: colors.softText,
  fontFamily,
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0",
};
