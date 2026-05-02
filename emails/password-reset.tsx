import { Section } from "@react-email/components";

import { EmailButton } from "@/emails/components/EmailButton";
import { EmailCard } from "@/emails/components/EmailCard";
import { EmailLayout } from "@/emails/components/EmailLayout";
import {
  EmailHeading,
  EmailMutedText,
  EmailText,
} from "@/emails/components/Typography";

export type PasswordResetEmailProps = {
  actionUrl: string;
  appUrl: string;
  userEmail?: string;
};

export function PasswordResetEmail({
  actionUrl,
  appUrl,
  userEmail,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout
      appUrl={appUrl}
      eyebrow="Password reset"
      preview="Use this link to reset your Duely password."
    >
      <EmailCard>
        <EmailHeading>Reset your password</EmailHeading>
        <EmailText>
          We received a request to reset your password. Use the link below to choose a new password.
        </EmailText>
        {userEmail ? (
          <EmailMutedText>This reset link was requested for {userEmail}.</EmailMutedText>
        ) : null}
        <Section style={ctaSection}>
          <EmailButton href={actionUrl}>Reset password</EmailButton>
        </Section>
        <EmailMutedText>
          If you did not request this, please ignore this message.
        </EmailMutedText>
      </EmailCard>
    </EmailLayout>
  );
}

const ctaSection = {
  margin: "24px 0 18px",
};
