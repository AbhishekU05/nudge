import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { lateFeeWorkflow } from "@/lib/inngest/functions/late-fee-workflow";
import { sendDigest } from "@/lib/inngest/functions/send-digest";
import { sendOrgDigest } from "@/lib/inngest/functions/send-org-digest";
import { automationWorkflow } from "@/lib/inngest/functions/automation-workflow";
import { quickbooksInitialSync } from "@/lib/inngest/functions/quickbooks-initial-sync";
import { processLateFee } from "@/lib/inngest/functions/process-late-fee";
import { xeroInitialSync } from "@/lib/inngest/functions/xero-initial-sync";
import { xeroBatchSync } from "@/lib/inngest/functions/xero-batch-sync";
import { pruneData } from "@/lib/inngest/functions/prune-data";
import { xeroWebhookEvent } from "@/lib/inngest/functions/xero-webhook-event";
import { quickbooksWebhookEvent } from "@/lib/inngest/functions/quickbooks-webhook-event";

export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    lateFeeWorkflow,
    processLateFee,
    sendDigest,
    sendOrgDigest,
    automationWorkflow,
    quickbooksInitialSync,
    xeroInitialSync,
    xeroBatchSync,
    pruneData,
    xeroWebhookEvent,
    quickbooksWebhookEvent,
  ],
});
