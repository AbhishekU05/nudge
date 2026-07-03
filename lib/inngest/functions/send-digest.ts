import { inngest } from "@/lib/inngest/client";
import { sendWeeklyDigestEmails } from "@/lib/email/send-digest";

export const sendDigest = inngest.createFunction(
  { id: "send-digest", triggers: [{ cron: "0 8 * * 1" }] },
  async ({ step }) => {
    const result = await sendWeeklyDigestEmails();
    if (!result.success) {
      throw result.error || new Error("Failed to send digest");
    }
    return result;
  }
);
