import { inngest } from "@/lib/inngest/client";
import { syncXeroInvoicesForOrg } from "@/lib/xero";
import { logger } from "@/lib/logger";

export const xeroInitialSync = inngest.createFunction(
  { id: "xero-initial-sync", triggers: [{ event: "xero/integration.connected" }] },
  async ({ event, step }) => {
    const { organization_id } = event.data;

    try {
      const result = await step.run("sync-xero-org", async () => {
        return await syncXeroInvoicesForOrg(organization_id);
      });
      
      logger.external({
        service: "Xero",
        action: "initial_sync",
        success: true,
        organization_id,
      });

      return { success: true, ...result };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.external({
        service: "Xero",
        action: "initial_sync",
        success: false,
        organization_id,
        error: message,
      });
      throw new Error(message);
    }
  }
);
