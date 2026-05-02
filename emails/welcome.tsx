import { Section } from "@react-email/components";

import { EmailButton } from "@/emails/components/EmailButton";
import { EmailCard } from "@/emails/components/EmailCard";
import { EmailLayout } from "@/emails/components/EmailLayout";
import {
  EmailHeading,
  EmailMutedText,
  EmailText,
} from "@/emails/components/Typography";

export type WelcomeEmailProps = {
  appUrl: string;
  userName?: string | null;
};

export function WelcomeEmail({ appUrl, userName }: WelcomeEmailProps) {
  const greeting = userName?.trim() ? `Hi ${userName.trim()},` : "Hi there,";

  return (
    <EmailLayout
      appUrl={appUrl}
      eyebrow="Welcome"
      preview="Your Nudge account is ready."
    >
      <EmailCard>
        <EmailHeading>Your account is ready</EmailHeading>
        <EmailText>{greeting}</EmailText>
        <EmailText>
          Welcome to Nudge. You can now create payment reminders and track their status from your dashboard.
        </EmailText>
        <Section style={ctaSection}>
          <EmailButton href={`${appUrl.replace(/\/+$/, "")}/dashboard`}>
            Open dashboard
          </EmailButton>
        </Section>
        <EmailMutedText>
          If you have any questions, reply to this email.
        </EmailMutedText>
      </EmailCard>
    </EmailLayout>
  );
}

const ctaSection = {
  margin: "24px 0 18px",
};
