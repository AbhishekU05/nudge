import { inngest } from "@/lib/inngest/client";
import { getXeroTotalPages } from "@/lib/xero";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { xeroBatchSync } from "./xero-batch-sync";

export const xeroInitialSync = inngest.createFunction(
  { id: "xero-initial-sync", triggers: [{ event: "xero/integration.connected" }] },
  async ({ event, step }) => {
    const { organization_id, syncType = "invoices" } = event.data;
    const supabase = createSupabaseAdminClient();

    try {
      await step.run("update-sync-state", async () => {
        await supabase.from("integrations").update({ sync_state: `syncing_${syncType}`, sync_pages_completed: 0 }).eq("organization_id", organization_id).eq("provider", "xero");
      });

      const totalPages = await step.run("calculate-total-pages", async () => {
        return await getXeroTotalPages(organization_id, syncType as "invoices" | "payments");
      });

      await step.run("update-sync-total", async () => {
        await supabase.from("integrations").update({ sync_pages_total: totalPages }).eq("organization_id", organization_id).eq("provider", "xero");
      });

      if (totalPages > 0) {
        const numJobs = Math.min(5, totalPages);
        const pagesPerJob = Math.ceil(totalPages / numJobs);
        
        const batches = [];
        for (let i = 0; i < numJobs; i++) {
          const startPage = i * pagesPerJob + 1;
          const endPage = Math.min((i + 1) * pagesPerJob, totalPages);
          if (startPage <= endPage) {
            batches.push({ startPage, endPage });
          }
        }

        const jobs = batches.map(batch => 
          step.invoke(`sync-batch-${batch.startPage}-${batch.endPage}`, {
            function: xeroBatchSync,
            data: {
              organization_id,
              syncType,
              startPage: batch.startPage,
              endPage: batch.endPage
            }
          })
        );

        await Promise.all(jobs);
      }

      if (syncType === "invoices") {
        await step.sendEvent("start-payments", {
          name: "xero/integration.connected",
          data: { organization_id, syncType: "payments" }
        });
      } else {
        await step.run("finish-sync", async () => {
          await supabase.from("integrations").update({ sync_state: "idle", last_synced_at: new Date().toISOString() }).eq("organization_id", organization_id).eq("provider", "xero");
        });
      }

      logger.external({
        service: "Xero",
        action: "initial_sync_phase_complete",
        success: true,
        organization_id
      });

      return { success: true, totalPages, syncType };
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
