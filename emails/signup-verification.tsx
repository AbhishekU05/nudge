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
      preview="Confirm your email address to use Duely."
    >
      <EmailCard>
        <EmailHeading>Confirm your email</EmailHeading>
        <EmailText>
          Please confirm your email address to finish creating your account.
        </EmailText>
        {userEmail ? (
          <EmailMutedText>This verification link was requested for {userEmail}.</EmailMutedText>
        ) : null}
        <Section style={ctaSection}>
          <EmailButton href={actionUrl}>Confirm email</EmailButton>
        </Section>
        <EmailMutedText>
          If you did not create an account, please ignore this message.
        </EmailMutedText>
      </EmailCard>
    </EmailLayout>
  );
}

const ctaSection = {
  margin: "24px 0 18px",
};
