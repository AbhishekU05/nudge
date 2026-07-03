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
      .select("organization_id, organizations!inner(dodo_subscription_status, created_at)")
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

    const { isAutomationAndIntegrationAllowed } = await import("@/lib/payments");

    const results = [];
    for (const integration of integrations || []) {
      const org = Array.isArray(integration.organizations) ? integration.organizations[0] : integration.organizations;
      if (!isAutomationAndIntegrationAllowed((org as any)?.dodo_subscription_status, (org as any)?.created_at)) {
        continue;
      }
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
