import { inngest } from "@/lib/inngest/client";
import { sendWeeklyDigestEmails } from "@/lib/email/send-digest";

// Runs every hour, not just once at 08:00 UTC on Monday: sendWeeklyDigestEmails
// filters recipients by whether it's currently Monday 8am in *their own* org's
// timezone, which can only ever be true once a week for a UTC-only cron - every
// non-UTC org would never match and would never receive a digest.
export const sendDigest = inngest.createFunction(
  { id: "send-digest", triggers: [{ cron: "0 * * * *" }] },
  async () => {
    const result = await sendWeeklyDigestEmails();
    if (!result.success) {
      throw result.error || new Error("Failed to send digest");
    }
    return result;
  }
);
