import { Button } from "@react-email/components";

import { colors, fontFamily } from "@/emails/components/styles";

type EmailButtonProps = {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "secondary";
};

export function EmailButton({
  children,
  href,
  variant = "primary",
}: EmailButtonProps) {
  return (
    <Button
      href={href}
      style={variant === "primary" ? primaryButton : secondaryButton}
    >
      {children}
    </Button>
  );
}

const buttonBase = {
  borderRadius: "10px",
  display: "inline-block",
  fontFamily,
  fontSize: "14px",
  fontWeight: "700",
  lineHeight: "20px",
  padding: "12px 18px",
  textDecoration: "none",
};

const primaryButton = {
  ...buttonBase,
  backgroundColor: colors.accent,
  color: "#FFFFFF",
};

const secondaryButton = {
  ...buttonBase,
  backgroundColor: "#FFFFFF",
  border: `1px solid ${colors.border}`,
  color: colors.text,
};
