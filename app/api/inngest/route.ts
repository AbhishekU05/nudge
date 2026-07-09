import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { applyLateFees } from "@/lib/inngest/functions/apply-late-fees";
import { sendDigest } from "@/lib/inngest/functions/send-digest";
import { automationWorkflow } from "@/lib/inngest/functions/automation-workflow";
import { quickbooksInitialSync } from "@/lib/inngest/functions/quickbooks-initial-sync";
import { processLateFee } from "@/lib/inngest/functions/process-late-fee";
import { xeroInitialSync } from "@/lib/inngest/functions/xero-initial-sync";
import { xeroBatchSync } from "@/lib/inngest/functions/xero-batch-sync";
import { pruneData } from "@/lib/inngest/functions/prune-data";

export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    applyLateFees,
    processLateFee,
    sendDigest,
    automationWorkflow,
    quickbooksInitialSync,
    xeroInitialSync,
    xeroBatchSync,
    pruneData,
  ],
});
