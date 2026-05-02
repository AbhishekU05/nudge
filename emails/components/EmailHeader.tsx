import { Img, Link, Section, Text } from "@react-email/components";

import { colors, fontFamily } from "@/emails/components/styles";

type EmailHeaderProps = {
  appUrl: string;
  eyebrow?: string;
};

export function EmailHeader({ appUrl, eyebrow }: EmailHeaderProps) {
  const normalizedAppUrl = appUrl.replace(/\/+$/, "");

  return (
    <Section style={header}>
      <Link href={normalizedAppUrl} style={brandLink}>
        <Img
          src={`${appUrl}/logo.svg`}
          width="24"
          height="24"
          alt="Duely"
          style={logo}
        />
        <Text style={brandName}>Duely</Text>
      </Link>
      {eyebrow ? <Text style={eyebrowStyle}>{eyebrow}</Text> : null}
    </Section>
  );
}

const header = {
  padding: "0 0 22px",
};

const brandLink = {
  display: "inline-block",
  textDecoration: "none",
};

const logo = {
  display: "inline-block",
  margin: "0 9px 0 0",
  verticalAlign: "middle",
  width: "31px",
};

const brandName = {
  color: colors.text,
  display: "inline-block",
  fontFamily,
  fontSize: "16px",
  fontWeight: "700",
  letterSpacing: "-0.02em",
  lineHeight: "22px",
  margin: "0",
  verticalAlign: "middle",
};

const eyebrowStyle = {
  color: colors.softText,
  fontFamily,
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "0.16em",
  lineHeight: "18px",
  margin: "18px 0 0",
  textTransform: "uppercase" as const,
};
