export function getEmailLinkErrorMessage(description?: string | null) {
  const fallback =
    "That email link is invalid or has expired. Request a new reset link and use the latest email.";

  if (!description) {
    return fallback;
  }

  const normalized = description.replace(/\+/g, " ").trim();

  if (
    normalized.toLowerCase().includes("expired") ||
    normalized.toLowerCase().includes("invalid")
  ) {
    return fallback;
  }

  return normalized;
}
