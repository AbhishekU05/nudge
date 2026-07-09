import { inngest } from "@/lib/inngest/client";
import { syncQuickBooksInvoicesForOrg } from "@/lib/quickbooks";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const quickbooksInitialSync = inngest.createFunction(
  { id: "quickbooks-initial-sync", triggers: [{ event: "quickbooks/integration.connected" }] },
  async ({ event, step }) => {
    const { organization_id } = event.data;

    const supabase = createSupabaseAdminClient();

    try {
      await step.run("update-sync-state", async () => {
        await supabase.from("integrations").update({ sync_state: "syncing_invoices" }).eq("organization_id", organization_id).eq("provider", "quickbooks");
      });

      const result = await step.run("sync-quickbooks-invoices", async () => {
        return await syncQuickBooksInvoicesForOrg(organization_id);
      });

      await step.run("finish-sync-state", async () => {
        await supabase.from("integrations").update({ sync_state: "idle", last_synced_at: new Date().toISOString() }).eq("organization_id", organization_id).eq("provider", "quickbooks");
      });

      logger.external({
        service: "QuickBooks",
        action: "initial_sync_complete",
        success: true,
        organization_id,
      });

      return result;
    } catch (err) {
      await step.run("fail-sync-state", async () => {
        await supabase.from("integrations").update({ sync_state: "idle" }).eq("organization_id", organization_id).eq("provider", "quickbooks");
      });

      const message = err instanceof Error ? err.message : "Unknown error";
      logger.external({
        service: "QuickBooks",
        action: "initial_sync",
        success: false,
        organization_id,
        error: message,
      });
      throw new Error(message);
    }
  }
);
