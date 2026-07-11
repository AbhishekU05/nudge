import { inngest } from "@/lib/inngest/client";
import { getEligibleDigestRecipients, sendDigestEmailForUser } from "@/lib/email/send-digest";

// Runs every hour, not just once at 08:00 UTC on Monday: sendWeeklyDigestEmails
// filters recipients by whether it's currently Monday 8am in *their own* org's
// timezone, which can only ever be true once a week for a UTC-only cron - every
// non-UTC org would never match and would never receive a digest.
export const sendDigest = inngest.createFunction(
  { id: "send-digest", triggers: [{ cron: "0 * * * *" }] },
  async ({ step }) => {
    const result = await step.run("get-eligible-recipients", () => getEligibleDigestRecipients());
    if (!result.success) {
      throw result.error instanceof Error ? result.error : new Error("Failed to fetch digest recipients");
    }

    // Each user's send is its own step so a retry after a mid-batch failure
    // only re-runs the users who didn't get memoized as successful, instead
    // of re-sending the digest to everyone processed before the failure.
    let emailsSent = 0;
    for (const { userId, userEmail } of result.recipients) {
      const { sent } = await step.run(`send-digest-${userId}`, () => sendDigestEmailForUser(userId, userEmail));
      if (sent) emailsSent++;
    }

    return { success: true, count: emailsSent };
  }
);
