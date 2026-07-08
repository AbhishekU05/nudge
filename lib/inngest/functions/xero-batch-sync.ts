import { inngest } from "@/lib/inngest/client";
import { syncXeroDataPageForOrg } from "@/lib/xero";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const xeroBatchSync = inngest.createFunction(
  { id: "xero-batch-sync", triggers: [{ event: "xero/integration.batch" }] },
  async ({ event, step }) => {
    const { organization_id, syncType, startPage, endPage } = event.data;
    const supabase = createSupabaseAdminClient();
    
    let importedTotal = 0;
    
    for (let page = startPage; page <= endPage; page++) {
      const result = await step.run(`sync-page-${page}`, async () => {
        return await syncXeroDataPageForOrg(organization_id, syncType, page);
      });
      
      importedTotal += result.imported;

      await step.run(`update-progress-${page}`, async () => {
        const { data } = await supabase.from("integrations").select("sync_pages_completed").eq("organization_id", organization_id).eq("provider", "xero").single();
        if (data) {
          await supabase.from("integrations").update({ sync_pages_completed: (data.sync_pages_completed || 0) + 1 }).eq("organization_id", organization_id).eq("provider", "xero");
        }
      });
    }

    return { success: true, importedTotal };
  }
);
