import { Section, Text } from "@react-email/components";

import { EmailCard } from "@/emails/components/EmailCard";
import { EmailLayout } from "@/emails/components/EmailLayout";
import {
  EmailHeading,
  EmailLabel,
  EmailMutedText,
  EmailText,
} from "@/emails/components/Typography";
import { baseText, colors } from "@/emails/components/styles";

export type FeedbackNotificationEmailProps = {
  appUrl: string;
  message: string;
  userEmail: string;
};

export function FeedbackNotificationEmail({
  appUrl,
  message,
  userEmail,
}: FeedbackNotificationEmailProps) {
  return (
    <EmailLayout
      appUrl={appUrl}
      eyebrow="Product feedback"
      preview={`New feedback from ${userEmail}`}
    >
      <EmailCard>
        <EmailHeading>New feedback received</EmailHeading>
        <EmailText>
          A Duely user sent feedback from inside the product.
        </EmailText>

        <Section style={meta}>
          <EmailLabel>Sender</EmailLabel>
          <EmailMutedText>{userEmail}</EmailMutedText>
        </Section>

        <Section style={messageBox}>
          <EmailLabel>Message</EmailLabel>
          <Text style={messageText}>{message}</Text>
        </Section>
      </EmailCard>
    </EmailLayout>
  );
}

const meta = {
  margin: "20px 0",
};

const messageBox = {
  backgroundColor: "#F8F8FC",
  border: `1px solid ${colors.softBorder}`,
  borderRadius: "14px",
  margin: "20px 0 0",
  padding: "18px",
};

const messageText = {
  ...baseText,
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};
