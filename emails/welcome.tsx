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
      preview="Your Nudge workspace is ready."
    >
      <EmailCard>
        <EmailHeading>Your workspace is ready</EmailHeading>
        <EmailText>{greeting}</EmailText>
        <EmailText>
          Welcome to Nudge. Create your first payment reminder, choose a calm
          follow-up cadence, and let Nudge handle the awkward inbox chase.
        </EmailText>
        <Section style={ctaSection}>
          <EmailButton href={`${appUrl.replace(/\/+$/, "")}/dashboard`}>
            Open dashboard
          </EmailButton>
        </Section>
        <EmailMutedText>
          Nudge is designed to feel more like a productivity assistant than
          accounting software.
        </EmailMutedText>
      </EmailCard>
    </EmailLayout>
  );
}

const ctaSection = {
  margin: "24px 0 18px",
};
