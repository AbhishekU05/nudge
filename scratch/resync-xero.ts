// One-off catch-up after the Xero webhook idempotency bug (24h+ of dropped
// invoice/payment updates). Fires the SAME event a fresh Xero connect fires, for
// every Xero-connected org, which re-runs xero-initial-sync -> paginated
// syncXeroDataPageForOrg (idempotent upserts: invoices, then payments). No Xero
// logic is duplicated here.
//
// Run AFTER deploying the webhook fix. Needs NEXT_PUBLIC_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, INNGEST_EVENT_KEY in the environment. e.g.:
//   npx tsx scratch/resync-xero.ts
// Optionally pass specific org ids to scope it:
//   npx tsx scratch/resync-xero.ts <org-uuid> <org-uuid> ...

import { createClient } from "@supabase/supabase-js";
import { Inngest } from "inngest";

async function resyncXero() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );
  const inngest = new Inngest({ id: "duely", eventKey: process.env.INNGEST_EVENT_KEY });

  const argOrgs = process.argv.slice(2);
  let orgIds: string[];

  if (argOrgs.length > 0) {
    orgIds = argOrgs;
  } else {
    const { data, error } = await supabase
      .from("integrations")
      .select("organization_id")
      .eq("provider", "xero");
    if (error) {
      console.error("Failed to list Xero integrations:", error.message);
      process.exit(1);
    }
    orgIds = (data ?? []).map((r: { organization_id: string }) => r.organization_id);
  }

  console.log(`Queueing Xero re-sync for ${orgIds.length} org(s)...`);
  for (const organization_id of orgIds) {
    await inngest.send({
      name: "xero/integration.connected",
      data: { organization_id, syncType: "invoices" },
    });
    console.log(`  queued: ${organization_id}`);
  }
  console.log("Done. Watch Inngest for xero-initial-sync / xero-batch-sync runs.");
}

resyncXero().catch((err) => {
  console.error(err);
  process.exit(1);
});
