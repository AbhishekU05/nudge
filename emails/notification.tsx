import { Section } from "@react-email/components";

import { EmailButton } from "@/emails/components/EmailButton";
import { EmailCard } from "@/emails/components/EmailCard";
import { EmailLayout } from "@/emails/components/EmailLayout";
import {
  EmailHeading,
  EmailMutedText,
  EmailText,
} from "@/emails/components/Typography";

export type NotificationEmailProps = {
  actionLabel?: string;
  actionUrl?: string;
  appUrl: string;
  body: string;
  preview?: string;
  title: string;
};

export function NotificationEmail({
  actionLabel,
  actionUrl,
  appUrl,
  body,
  preview,
  title,
}: NotificationEmailProps) {
  return (
    <EmailLayout
      appUrl={appUrl}
      eyebrow="Notification"
      preview={preview ?? title}
    >
      <EmailCard>
        <EmailHeading>{title}</EmailHeading>
        <EmailText>{body}</EmailText>
        {actionUrl && actionLabel ? (
          <Section style={ctaSection}>
            <EmailButton href={actionUrl}>{actionLabel}</EmailButton>
          </Section>
        ) : (
          <EmailMutedText>No action is required.</EmailMutedText>
        )}
      </EmailCard>
    </EmailLayout>
  );
}

const ctaSection = {
  margin: "24px 0 0",
};
