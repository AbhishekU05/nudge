import { inngest } from "@/lib/inngest/client";
import { syncXeroDataPageForOrg } from "@/lib/xero";
import { logger } from "@/lib/logger";

export const xeroInitialSync = inngest.createFunction(
  { id: "xero-initial-sync", triggers: [{ event: "xero/integration.connected" }] },
  async ({ event, step }) => {
    const { organization_id, page = 1, syncType = "invoices" } = event.data;

    try {
      const result = await step.run("sync-xero-org-page", async () => {
        return await syncXeroDataPageForOrg(organization_id, syncType as "invoices" | "payments", page);
      });
      
      if (result.hasMore || result.nextType !== syncType) {
        await step.sendEvent("queue-next-page", {
          name: "xero/integration.connected",
          data: {
            organization_id,
            page: result.nextPage,
            syncType: result.nextType
          }
        });
      }

      logger.external({
        service: "Xero",
        action: "initial_sync_page",
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
