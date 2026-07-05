import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { applyLateFees } from "@/lib/inngest/functions/apply-late-fees";
import { sendDigest } from "@/lib/inngest/functions/send-digest";
import { sendReminders } from "@/lib/inngest/functions/send-reminders";
import { syncQuickBooks } from "@/lib/inngest/functions/sync-quickbooks";
import { xeroInitialSync } from "@/lib/inngest/functions/xero-initial-sync";

export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    applyLateFees,
    sendDigest,
    sendReminders,
    syncQuickBooks,
    xeroInitialSync,
  ],
});
