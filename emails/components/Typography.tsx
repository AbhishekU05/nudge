import { Heading, Text } from "@react-email/components";

import { baseText, colors, fontFamily, mutedText } from "@/emails/components/styles";

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return <Heading style={heading}>{children}</Heading>;
}

export function EmailText({ children }: { children: React.ReactNode }) {
  return <Text style={paragraph}>{children}</Text>;
}

export function EmailMutedText({ children }: { children: React.ReactNode }) {
  return <Text style={mutedParagraph}>{children}</Text>;
}

export function EmailLabel({ children }: { children: React.ReactNode }) {
  return <Text style={label}>{children}</Text>;
}

const heading = {
  color: colors.text,
  fontFamily,
  fontSize: "28px",
  fontWeight: "700",
  letterSpacing: "-0.04em",
  lineHeight: "34px",
  margin: "0 0 16px",
};

const paragraph = {
  ...baseText,
  margin: "0 0 16px",
};

const mutedParagraph = {
  ...mutedText,
  margin: "0 0 16px",
};

const label = {
  color: colors.softText,
  fontFamily,
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.14em",
  lineHeight: "18px",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};
