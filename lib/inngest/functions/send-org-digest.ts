import { inngest } from "@/lib/inngest/client";
import { buildOrgDigest, sendDigestEmailForUser, type DigestRecipient } from "@/lib/email/send-digest";

// Builds one organization's digest and sends it to that org's members.
//
// Fanned out from the hourly send-digest cron so that Monday morning does not
// become a single long run that queries every org back-to-back. The concurrency
// limits are the point of this function:
//
//   - the unkeyed limit caps how many orgs are built at once, so the database
//     sees a bounded number of concurrent digest queries no matter how many orgs
//     share a timezone;
//   - the per-org limit of 1 means an org can never have two digest runs in
//     flight at the same time (e.g. a retry overlapping the original).
export const sendOrgDigest = inngest.createFunction(
  {
    id: "send-org-digest",
    retries: 3,
    triggers: [{ event: "digest/org.send" }],
    concurrency: [
      { limit: 5 },
      { limit: 1, key: "event.data.organizationId" },
    ],
  },
  async ({ event, step }) => {
    const organizationId = event.data.organizationId as string;
    const recipients = (event.data.recipients || []) as DigestRecipient[];

    if (!organizationId || recipients.length === 0) {
      return { success: true, sent: 0 };
    }

    // Built once and reused for every member: the digest is org-scoped, so an
    // org with N members used to run this entire fetch-and-aggregate pass N
    // times to produce N identical emails.
    const digest = await step.run("build-digest", () => buildOrgDigest(organizationId));

    if (digest.length === 0) {
      return { success: true, sent: 0, reason: "no invoices or payments to report" };
    }

    // Each send is its own step so a retry after a mid-batch failure only
    // re-runs the users who were not memoized as successful, instead of
    // re-sending the digest to everyone processed before the failure.
    let emailsSent = 0;
    for (const { userId, userEmail } of recipients) {
      const { sent } = await step.run(`send-digest-${userId}`, () =>
        sendDigestEmailForUser(userId, userEmail, digest, { markSent: true })
      );
      if (sent) emailsSent++;
    }

    return { success: true, sent: emailsSent };
  }
);
