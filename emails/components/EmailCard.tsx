import { Section } from "@react-email/components";

import { colors } from "@/emails/components/styles";

type EmailCardProps = {
  children: React.ReactNode;
  padded?: boolean;
};

export function EmailCard({ children, padded = true }: EmailCardProps) {
  return <Section style={padded ? card : cardCompact}>{children}</Section>;
}

const cardBase = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: "18px",
};

const card = {
  ...cardBase,
  padding: "30px",
};

const cardCompact = {
  ...cardBase,
  padding: "0",
};
