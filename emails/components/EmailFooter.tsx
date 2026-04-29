import { Hr, Link, Section, Text } from "@react-email/components";

import { colors, fontFamily } from "@/emails/components/styles";

type EmailFooterProps = {
  appUrl: string;
  children?: React.ReactNode;
  unsubscribeUrl?: string;
};

export function EmailFooter({
  appUrl,
  children,
  unsubscribeUrl,
}: EmailFooterProps) {
  const normalizedAppUrl = appUrl.replace(/\/+$/, "");

  return (
    <Section style={footer}>
      <Hr style={rule} />
      {children ? <Section style={footerContent}>{children}</Section> : null}
      <Text style={footerText}>
        Nudge helps people send calm, professional payment follow-ups.
      </Text>
      <Text style={footerText}>
        <Link href={normalizedAppUrl} style={footerLink}>
          nudgepay.co.in
        </Link>
        {unsubscribeUrl ? (
          <>
            <span style={dot}>•</span>
            <Link href={unsubscribeUrl} style={footerLink}>
              Unsubscribe
            </Link>
          </>
        ) : null}
      </Text>
    </Section>
  );
}

const footer = {
  padding: "24px 0 0",
};

const rule = {
  borderColor: colors.softBorder,
  margin: "0 0 20px",
};

const footerContent = {
  margin: "0 0 16px",
};

const footerText = {
  color: colors.softText,
  fontFamily,
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0 0 6px",
};

const footerLink = {
  color: colors.muted,
  textDecoration: "underline",
  textUnderlineOffset: "3px",
};

const dot = {
  color: colors.softText,
  margin: "0 8px",
};
