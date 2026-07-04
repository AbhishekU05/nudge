export function getEmailLinkErrorMessage(description?: string | null) {
  const fallback = "Something went wrong. Please try again.";

  if (!description) {
    return fallback;
  }

  const normalized = description.replace(/\+/g, " ").trim().toLowerCase();

  if (normalized.includes("expired") || normalized.includes("invalid")) {
    return "Your confirmation link has expired. Please log in or sign up again to receive a new link.";
  }

  return fallback;
}
