import {
  Body,
  Container,
  Head,
  Html,
  Preview,
} from "@react-email/components";

import { EmailFooter } from "@/emails/components/EmailFooter";
import { EmailHeader } from "@/emails/components/EmailHeader";
import { colors, fontFamily } from "@/emails/components/styles";

type EmailLayoutProps = {
  appUrl: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  preview: string;
  unsubscribeUrl?: string;
  eyebrow?: string;
};

export function EmailLayout({
  appUrl,
  children,
  footer,
  preview,
  unsubscribeUrl,
  eyebrow,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <EmailHeader appUrl={appUrl} eyebrow={eyebrow} />
          {children}
          <EmailFooter appUrl={appUrl} unsubscribeUrl={unsubscribeUrl}>
            {footer}
          </EmailFooter>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: colors.background,
  fontFamily,
  margin: "0",
  padding: "0",
};

const container = {
  margin: "0 auto",
  maxWidth: "600px",
  padding: "42px 20px",
};
