import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { applyLateFees } from "@/lib/inngest/functions/apply-late-fees";
import { sendDigest } from "@/lib/inngest/functions/send-digest";
import { sendReminders } from "@/lib/inngest/functions/send-reminders";
import { syncQuickBooks } from "@/lib/inngest/functions/sync-quickbooks";
import { syncXero } from "@/lib/inngest/functions/sync-xero";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    applyLateFees,
    sendDigest,
    sendReminders,
    syncQuickBooks,
    syncXero,
  ],
});
