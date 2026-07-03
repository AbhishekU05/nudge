import { inngest } from "@/lib/inngest/client";
import { syncXeroInvoicesForOrg } from "@/lib/xero";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export const syncXero = inngest.createFunction(
  { id: "sync-xero", triggers: [{ cron: "0 * * * *" }] },
  async ({ step }) => {
    const supabase = createSupabaseAdminClient();
    const { data: integrations, error } = await supabase
      .from("integrations")
      .select("organization_id")
      .eq("provider", "xero");

    if (error) {
      logger.external({
        service: "Xero",
        action: "cron_sync",
        success: false,
        error: error.message,
      });
      throw new Error(error.message);
    }

    const results = [];
    for (const integration of integrations || []) {
      try {
        const result = await syncXeroInvoicesForOrg(integration.organization_id);
        results.push({ organizationId: integration.organization_id, success: true, ...result });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({ organizationId: integration.organization_id, success: false, error: message });
        logger.external({
          service: "Xero",
          action: "cron_sync",
          success: false,
          organization_id: integration.organization_id,
          error: message,
        });
      }
    }

    return { results };
  }
);
