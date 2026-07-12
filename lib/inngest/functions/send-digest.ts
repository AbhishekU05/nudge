import { inngest } from "@/lib/inngest/client";
import { getEligibleDigestRecipients } from "@/lib/email/send-digest";

// Runs every hour, not just once at 08:00 UTC on Monday: recipients are filtered
// by whether it is currently Monday 8am or later in *their own* org's timezone,
// which a UTC-only cron could never satisfy for a non-UTC org.
//
// This function only decides *who* is due and fans out one event per org. The
// actual build-and-send happens in send-org-digest, which is concurrency-limited:
// doing every org inline here would mean one long run whose DB queries all burst
// inside the same hour, and where a single bad org can drag the whole batch
// toward a timeout.
export const sendDigest = inngest.createFunction(
  { id: "send-digest", triggers: [{ cron: "0 * * * *" }] },
  async ({ step }) => {
    const result = await step.run("get-eligible-recipients", () => getEligibleDigestRecipients());
    if (!result.success) {
      throw result.error instanceof Error ? result.error : new Error("Failed to fetch digest recipients");
    }

    if (result.recipients.length === 0) {
      return { success: true, organizations: 0, recipients: 0 };
    }

    // The digest is identical for every member of an org, so it is built once per
    // org rather than once per recipient.
    const recipientsByOrg = new Map<string, typeof result.recipients>();
    for (const recipient of result.recipients) {
      const bucket = recipientsByOrg.get(recipient.organizationId) || [];
      bucket.push(recipient);
      recipientsByOrg.set(recipient.organizationId, bucket);
    }

    await step.sendEvent(
      "fan-out-org-digests",
      Array.from(recipientsByOrg, ([organizationId, recipients]) => ({
        name: "digest/org.send",
        data: { organizationId, recipients },
      }))
    );

    return { success: true, organizations: recipientsByOrg.size, recipients: result.recipients.length };
  }
);
