import { Section } from "@react-email/components";

import { EmailButton } from "@/emails/components/EmailButton";
import { EmailCard } from "@/emails/components/EmailCard";
import { EmailLayout } from "@/emails/components/EmailLayout";
import {
  EmailHeading,
  EmailMutedText,
  EmailText,
} from "@/emails/components/Typography";

export type SignupVerificationEmailProps = {
  actionUrl: string;
  appUrl: string;
  userEmail?: string;
};

export function SignupVerificationEmail({
  actionUrl,
  appUrl,
  userEmail,
}: SignupVerificationEmailProps) {
  return (
    <EmailLayout
      appUrl={appUrl}
      eyebrow="Verify email"
      preview="Confirm your email address to start using Nudge."
    >
      <EmailCard>
        <EmailHeading>Confirm your email</EmailHeading>
        <EmailText>
          Welcome to Nudge. Confirm your email address to finish creating your
          account and start sending calm payment follow-ups.
        </EmailText>
        {userEmail ? (
          <EmailMutedText>This verification link was requested for {userEmail}.</EmailMutedText>
        ) : null}
        <Section style={ctaSection}>
          <EmailButton href={actionUrl}>Confirm email</EmailButton>
        </Section>
        <EmailMutedText>
          If you did not create a Nudge account, you can safely ignore this
          email.
        </EmailMutedText>
      </EmailCard>
    </EmailLayout>
  );
}

const ctaSection = {
  margin: "24px 0 18px",
};
