import { Section } from "@react-email/components";

import { EmailButton } from "@/emails/components/EmailButton";
import { EmailCard } from "@/emails/components/EmailCard";
import { EmailLayout } from "@/emails/components/EmailLayout";
import {
  EmailHeading,
  EmailMutedText,
  EmailText,
} from "@/emails/components/Typography";

export type MagicLinkEmailProps = {
  actionUrl: string;
  appUrl: string;
  userEmail?: string;
};

export function MagicLinkEmail({
  actionUrl,
  appUrl,
  userEmail,
}: MagicLinkEmailProps) {
  return (
    <EmailLayout
      appUrl={appUrl}
      eyebrow="Secure sign-in"
      preview="Use this secure link to sign in to Nudge."
    >
      <EmailCard>
        <EmailHeading>Sign in to Nudge</EmailHeading>
        <EmailText>
          Use this secure link to open your Nudge workspace. The link is for
          one-time use and should only be opened by you.
        </EmailText>
        {userEmail ? (
          <EmailMutedText>This sign-in link was requested for {userEmail}.</EmailMutedText>
        ) : null}
        <Section style={ctaSection}>
          <EmailButton href={actionUrl}>Open Nudge</EmailButton>
        </Section>
        <EmailMutedText>
          If you did not request this link, you can safely ignore this email.
        </EmailMutedText>
      </EmailCard>
    </EmailLayout>
  );
}

const ctaSection = {
  margin: "24px 0 18px",
};
