import { inngest } from "@/lib/inngest/client";
import { syncQuickBooksInvoicesForOrg } from "@/lib/quickbooks";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export const syncQuickBooks = inngest.createFunction(
  { id: "sync-quickbooks", triggers: [{ cron: "0 * * * *" }] },
  async () => {
    const supabase = createSupabaseAdminClient();
    const { data: integrations, error } = await supabase
      .from("integrations")
      .select("organization_id, organizations!inner(dodo_subscription_status, created_at)")
      .eq("provider", "quickbooks");

    if (error) {
      logger.external({
        service: "QuickBooks",
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
      const orgData = org as { dodo_subscription_status?: string | null, created_at?: string | null } | undefined;
      if (!isAutomationAndIntegrationAllowed(orgData?.dodo_subscription_status as "active" | null | undefined, orgData?.created_at)) {
        continue;
      }
      try {
        const result = await syncQuickBooksInvoicesForOrg(integration.organization_id);
        results.push({ organizationId: integration.organization_id, success: true, ...result });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({ organizationId: integration.organization_id, success: false, error: message });
        logger.external({
          service: "QuickBooks",
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
