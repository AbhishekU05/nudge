export const colors = {
  accent: "#4F46E5",
  background: "#F6F7F9",
  border: "#E5E7EB",
  card: "#FFFFFF",
  muted: "#6B7280",
  softBorder: "#EEF0F3",
  softText: "#9CA3AF",
  text: "#111827",
};

export const fontFamily =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const baseText = {
  color: colors.text,
  fontFamily,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
};

export const mutedText = {
  ...baseText,
  color: colors.muted,
};
