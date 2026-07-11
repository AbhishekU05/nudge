// One-time reconciliation: for every already-connected Xero org, check every
// Duely invoice that has a xero_id against Xero's *current* live state, and
// correct anything that's drifted:
//   - Xero no longer has the invoice at all (a draft that was later deleted,
//     or still an un-authorised draft/submitted invoice) -> delete the row.
//     Duely's sync no longer pulls in DRAFT/SUBMITTED invoices going forward
//     (see lib/xero.ts), but these are leftovers from before that change.
//   - Invoice is VOIDED in Xero -> correct Duely's status to "written_off"
//     (see lib/xero.ts's getWorkflowStatus for why this matters: reminders
//     and late fees are excluded on "written_off" the same as "paid").
//   - Anything else (still AUTHORISED/PAID) -> left untouched. This script
//     deliberately does NOT touch amount/due_date/reminders_enabled/etc. -
//     it only corrects status or removes rows that shouldn't exist, so it
//     can't clobber a user's automation settings the way a full re-sync
//     would (lib/xero.ts's bulk sync payload has a separate known issue
//     where it resets reminders_enabled on every update - not touched here).
//
// Efficient by design: uses Xero's list endpoint (paginated, ~100/call) to
// build a map of every AUTHORISED/PAID/VOIDED invoice for the org in a
// handful of calls, instead of one GET per invoice - a naive per-invoice
// loop is what caused the 429 (daily quota exhaustion) this script exists
// to clean up after. The list fetch is bounded to the last 2 years (the same
// cutoff the regular sync uses for PAID invoices, see lib/xero.ts) since
// that's the oldest anything in Duely could be. Invoices missing from that
// list get one individual verification GET before deletion, as a safety net
// against any pagination gap incorrectly treating a still-valid invoice as
// gone - that individual check has no date restriction, so it still catches
// anything unexpectedly older than the 2-year window correctly.
//
// Every invoice checked is logged - not just the ones that change - both to
// the console and to a append-as-you-go JSONL file (so a mid-run crash keeps
// whatever was logged up to that point) at scratch/reconcile-logs/.
//
// Applying changes is transactional per org: all the Xero reads and
// decision-making happen first with no DB writes, then the planned
// deletes/corrections for that org are applied in one call to the
// reconcile_xero_invoice_batch Postgres function (see the matching
// migration) - a single function invocation is one transaction, so if
// anything in that batch fails, nothing for that org is left half-applied.
// Requires that migration to be pushed before running with DRY_RUN=false.
//
// Idempotent: re-running is safe. Deleted rows are simply absent from the
// next run's query (nothing to re-delete). The written_off update only ever
// touches rows where status != 'written_off' (both here and inside the SQL
// function itself), so correcting an already-corrected row is a no-op, not
// a duplicate write or an error.
//
// Defaults to DRY_RUN (no writes) - rerun with DRY_RUN=false once the
// printed plan looks right.
//
// Usage notes:
//   - The `dotenv` package the other scratch/ scripts import isn't an
//     installed dependency in this repo, so this uses Node's native
//     --env-file instead (requires Node 20.6+, already satisfied here).
//   - This imports lib/xero.ts, which transitively imports lib/supabase/
//     admin.ts, which has `import "server-only"` - a marker package whose
//     package.json only resolves to its silent no-op under the "react-server"
//     export condition that Next.js's own bundler sets. Outside Next.js
//     (plain Node/tsx), it resolves to the OTHER export instead, which
//     throws unconditionally by design - so --conditions=react-server has
//     to be passed explicitly to make Node pick the silent one.
//
//   npx tsx --conditions=react-server --env-file=.env.local scratch/reconcile-xero-invoice-statuses.ts
//   DRY_RUN=false npx tsx --conditions=react-server --env-file=.env.local scratch/reconcile-xero-invoice-statuses.ts

import { createClient } from "@supabase/supabase-js";
import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";

import { withXeroRetry, fetchXeroInvoice, type XeroIntegrationRow } from "../lib/xero";

const DRY_RUN = process.env.DRY_RUN !== "false";
const DELAY_BETWEEN_ORGS_MS = 2000;
const LOOKBACK_YEARS = 2;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase env vars");
const supabase = createClient(supabaseUrl, supabaseKey);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const logDir = join(__dirname, "reconcile-logs");
mkdirSync(logDir, { recursive: true });
const logPath = join(logDir, `xero-reconcile-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`);

type LogEntry = Record<string, unknown> & { at?: string };

function logLine(entry: LogEntry) {
  const withTimestamp = { at: new Date().toISOString(), ...entry };
  appendFileSync(logPath, JSON.stringify(withTimestamp) + "\n");
}

function log(entry: LogEntry & { message: string }) {
  console.log(`  [${entry.action}] ${entry.message}`);
  logLine(entry);
}

async function fetchLiveXeroStatuses(integration: XeroIntegrationRow): Promise<Map<string, string>> {
  const statusMap = new Map<string, string>();
  let page = 1;

  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - LOOKBACK_YEARS);
  const year = cutoff.getFullYear();
  const month = String(cutoff.getMonth() + 1).padStart(2, "0");
  const day = String(cutoff.getDate()).padStart(2, "0");

  while (true) {
    const { result: response } = await withXeroRetry(integration, async (client, intg) => {
      // Bounded to the same lookback the regular sync uses - nothing in
      // Duely should be older than this, so this doesn't miss real rows.
      // The individual-verification fallback below has no such bound, as a
      // safety net in case that assumption is ever wrong for a given row.
      return client.accountingApi.getInvoices(
        intg.tenant_id,
        undefined,
        `Type=="ACCREC" AND Date >= DateTime(${year}, ${month}, ${day})`,
        "UpdatedDateUTC DESC",
        undefined,
        undefined,
        undefined,
        ["AUTHORISED", "PAID", "VOIDED"],
        page,
        false,
        undefined,
        undefined,
        false,
        100
      );
    });

    const invoices = response.body.invoices ?? [];
    for (const inv of invoices) {
      if (inv.invoiceID) statusMap.set(inv.invoiceID, String(inv.status));
    }

    if (invoices.length < 100) break;
    page += 1;
  }

  return statusMap;
}

async function reconcileOrg(integration: XeroIntegrationRow) {
  const organizationId = integration.organization_id;

  const liveStatuses = await fetchLiveXeroStatuses(integration);

  // Paginated - PostgREST caps a single request at its configured max rows
  // (commonly 1000), so a plain unpaginated select silently truncates for
  // any org with more invoices than that limit.
  const duelyInvoices: { id: string; xero_id: string; status: string }[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  while (true) {
    const { data: page, error } = await supabase
      .from("invoices")
      .select("id, xero_id, status")
      .eq("organization_id", organizationId)
      .not("xero_id", "is", null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      log({ action: "error", organizationId, message: `Failed to load Duely invoices (page starting at ${from}): ${error.message}` });
      return;
    }

    duelyInvoices.push(...(page ?? []));
    if (!page || page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const deleteIds: string[] = [];
  const writtenOffIds: string[] = [];
  let unchanged = 0;
  let listMismatch = 0;

  for (const inv of duelyInvoices ?? []) {
    const liveStatus = liveStatuses.get(inv.xero_id as string);

    if (liveStatus === "VOIDED") {
      if (inv.status !== "written_off") {
        writtenOffIds.push(inv.id);
        log({ action: "correct", organizationId, invoiceId: inv.id, xeroId: inv.xero_id, from: inv.status, to: "written_off", message: `${inv.id} (xero ${inv.xero_id}) ${inv.status} -> written_off` });
      } else {
        unchanged += 1;
        logLine({ action: "unchanged", organizationId, invoiceId: inv.id, xeroId: inv.xero_id, status: inv.status });
      }
      continue;
    }

    if (liveStatus === "AUTHORISED" || liveStatus === "PAID") {
      unchanged += 1;
      logLine({ action: "unchanged", organizationId, invoiceId: inv.id, xeroId: inv.xero_id, status: inv.status, liveStatus });
      continue;
    }

    // Not in the list result - verify individually before deleting, in case
    // this is a pagination gap (or older than the lookback window) rather
    // than a genuinely missing invoice.
    try {
      const { result: verifyInvoice } = await withXeroRetry(integration, async (client, intg) => {
        return fetchXeroInvoice(client, intg.tenant_id, inv.xero_id as string);
      });
      const verifiedStatus = verifyInvoice ? String(verifyInvoice.status) : undefined;

      if (verifiedStatus === "AUTHORISED" || verifiedStatus === "PAID") {
        // List fetch missed it - don't delete, just note it for investigation.
        listMismatch += 1;
        log({ action: "list-mismatch", organizationId, invoiceId: inv.id, xeroId: inv.xero_id, verifiedStatus, message: `${inv.id} (xero ${inv.xero_id}) is actually ${verifiedStatus} on Xero but wasn't in the list result - left untouched, investigate pagination/lookback window.` });
        continue;
      }

      if (verifiedStatus === "VOIDED") {
        writtenOffIds.push(inv.id);
        log({ action: "correct", organizationId, invoiceId: inv.id, xeroId: inv.xero_id, from: inv.status, to: "written_off", message: `${inv.id} (xero ${inv.xero_id}) ${inv.status} -> written_off (found on individual verify)` });
        continue;
      }

      // Still DRAFT/SUBMITTED, or some other non-issued state - never a real invoice.
      deleteIds.push(inv.id);
      log({ action: "delete", organizationId, invoiceId: inv.id, xeroId: inv.xero_id, reason: verifiedStatus ?? "unknown", message: `${inv.id} (xero ${inv.xero_id}) - still un-authorised on Xero (${verifiedStatus ?? "unknown"})` });
    } catch (verifyError) {
      const statusCode = (verifyError as { response?: { statusCode?: number } })?.response?.statusCode;
      if (statusCode === 400 || statusCode === 404) {
        deleteIds.push(inv.id);
        log({ action: "delete", organizationId, invoiceId: inv.id, xeroId: inv.xero_id, reason: `gone (${statusCode})`, message: `${inv.id} (xero ${inv.xero_id}) - gone from Xero (${statusCode})` });
      } else {
        log({ action: "error", organizationId, invoiceId: inv.id, xeroId: inv.xero_id, error: String(verifyError), message: `${inv.id} (xero ${inv.xero_id}) - unexpected error verifying, left untouched` });
      }
    }
  }

  if (DRY_RUN) {
    log({ action: "plan", organizationId, message: `[dry run] would delete ${deleteIds.length}, correct ${writtenOffIds.length} to written_off` });
  } else if (deleteIds.length > 0 || writtenOffIds.length > 0) {
    // One RPC call = one Postgres transaction for this org's whole batch -
    // see reconcile_xero_invoice_batch in the matching migration.
    const { error: applyError } = await supabase.rpc("reconcile_xero_invoice_batch", {
      p_organization_id: organizationId,
      p_delete_ids: deleteIds,
      p_written_off_ids: writtenOffIds,
    });

    if (applyError) {
      log({ action: "error", organizationId, message: `Failed to apply batch (rolled back, nothing for this org was changed): ${applyError.message}` });
    } else {
      log({ action: "applied", organizationId, message: `Applied: deleted ${deleteIds.length}, corrected ${writtenOffIds.length} to written_off` });
    }
  }

  console.log(
    `  Done: ${deleteIds.length} to delete, ${writtenOffIds.length} corrected to written_off, ${listMismatch} list-mismatch (left alone), ${unchanged} already fine. Total checked: ${duelyInvoices?.length ?? 0}.`
  );
}

async function main() {
  console.log(DRY_RUN ? "DRY RUN - no changes will be written. Rerun with DRY_RUN=false to apply.\n" : "LIVE RUN - changes will be written.\n");
  console.log(`Logging every invoice checked to ${logPath}\n`);

  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("provider", "xero");

  if (error || !integrations) {
    console.error("Failed to load Xero integrations:", error?.message);
    return;
  }

  for (const integration of integrations as XeroIntegrationRow[]) {
    if (!integration.tenant_id || integration.tenant_id === "PENDING_SELECTION") {
      console.log(`Skipping org ${integration.organization_id} - no tenant selected yet.`);
      continue;
    }

    console.log(`Reconciling org ${integration.organization_id} (tenant ${integration.tenant_id})...`);
    try {
      await reconcileOrg(integration);
    } catch (orgError) {
      console.error(`  Failed for org ${integration.organization_id}, skipping:`, orgError);
      logLine({ action: "org-failed", organizationId: integration.organization_id, error: String(orgError) });
    }

    await sleep(DELAY_BETWEEN_ORGS_MS);
  }

  console.log(`\nDone. Full log written to ${logPath}`);
}

main();
