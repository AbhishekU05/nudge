import { inngest } from "@/lib/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getValidQuickBooksTokens,
  getQuickBooksIntegrationByRealmId,
  fetchQuickBooksInvoice,
  fetchQuickBooksPayment,
  toIsoDate,
  normalizeEmail,
} from "@/lib/quickbooks";
import { logger } from "@/lib/logger";

// Moved verbatim from app/api/webhooks/quickbooks/route.ts — the route now
// only verifies the webhook signature and hands each entity notification
// off here so it can ack Intuit quickly regardless of how long the actual
// QuickBooks API fetch + upserts take. Logic itself is unchanged.
export const quickbooksWebhookEvent = inngest.createFunction(
  {
    id: "quickbooks-webhook-event",
    retries: 3,
    concurrency: {
      limit: 1,
      key: "event.data.entity.id",
    },
    triggers: [{ event: "quickbooks/webhook.event.received" }],
  },
  async ({ event }) => {
    const { realmId, entity } = event.data as {
      realmId: string;
      entity: Record<string, unknown> & { name?: string; id?: string; operation?: string; lastUpdated?: string };
    };

    if (!entity.id) return { skipped: true, reason: "missing_entity_id" };

    const supabase = createSupabaseAdminClient();
    const eventId = `${realmId}_${entity.name}_${entity.id}_${entity.lastUpdated}`;

    // Idempotency check
    const { data: existingEvent } = await supabase
      .from("webhook_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();

    if (existingEvent) {
      return { skipped: true, reason: "already_processed" }; // Already processed
    }

    // The event is only marked processed once we reach a settled outcome
    // below (synced, or determined there's nothing to sync) - not up front.
    // A transient failure (rate limit, network error) throws before this
    // runs, so Inngest's retry actually re-attempts the QuickBooks call
    // instead of finding the marker already there on retry and silently
    // no-op'ing. Mirrors the same fix in xero-webhook-event.ts.
    const markProcessed = () =>
      supabase.from("webhook_events").insert({
        id: eventId,
        event_type: `quickbooks_${entity.name}_${entity.operation}`,
        payload: entity,
        processed_at: new Date().toISOString(),
      });

    const integration = await getQuickBooksIntegrationByRealmId(realmId);
    if (!integration) {
      logger.external({ service: "QuickBooks", action: "webhook_sync", success: false, error: "Received webhook for unknown realmId", organization_id: realmId });
      await markProcessed();
      return { skipped: true, reason: "unknown_realm" };
    }

    const validIntegration = await getValidQuickBooksTokens(integration);

    // fetchQuickBooksInvoice/fetchQuickBooksPayment already resolve a 404 to
    // null instead of throwing (lib/quickbooks.ts), so an entity that no
    // longer exists on QuickBooks' side (e.g. a deleted draft) falls through
    // here as a no-op rather than an error - no extra handling needed for
    // that case, unlike the Xero equivalent.
    if (entity.name === "Invoice" && (entity.operation === "Create" || entity.operation === "Update")) {
      const invoice = await fetchQuickBooksInvoice(validIntegration.access_token, realmId, entity.id);
      if (invoice) {
        await upsertInvoice(supabase, integration.organization_id, invoice);
      }
    } else if (entity.name === "Payment" && (entity.operation === "Create" || entity.operation === "Update")) {
      const payment = await fetchQuickBooksPayment(validIntegration.access_token, realmId, entity.id);
      if (payment) {
        await upsertPayment(supabase, integration.organization_id, payment);
      }
    }

    // Update last_synced_at
    await supabase
      .from("integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("organization_id", integration.organization_id)
      .eq("provider", "quickbooks");

    await markProcessed();
    return { success: true };
  }
);

async function upsertInvoice(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  invoice: Record<string, unknown> & { TotalAmt?: number; Balance?: number; DueDate?: string; BillEmail?: { Address?: string }; CustomerRef?: { name?: string }; Id?: string; DocNumber?: string; InvoiceLink?: string; MetaData?: { LastUpdatedTime?: string }; CurrencyRef?: { value?: string } }
) {
  const totalAmount = Number(invoice.TotalAmt ?? 0);
  const amountPaid = totalAmount - Number(invoice.Balance ?? invoice.TotalAmt ?? 0);
  const isPaid = totalAmount > 0 && Number(invoice.Balance ?? totalAmount) <= 0;

  let status = "outstanding";
  if (isPaid) status = "paid";
  else if (amountPaid > 0 && amountPaid < totalAmount) status = "partial";
  else if (invoice.DueDate && new Date(invoice.DueDate) < new Date()) status = "overdue";

  const email = normalizeEmail(invoice.BillEmail?.Address);
  const contactName = invoice.CustomerRef?.name?.trim() || "Unknown";

  let clientRecord = null;

  if (email) {
    const { data } = await supabase.from("clients").select("id").eq("organization_id", organizationId).eq("email", email).maybeSingle();
    if (data) clientRecord = data;
  }

  if (!clientRecord) {
    const { data } = await supabase.from("clients").select("id").eq("organization_id", organizationId).eq("name", contactName).maybeSingle();
    if (data) clientRecord = data;
  }

  if (!clientRecord) {
    const { data: newClient, error } = await supabase.from("clients").insert({
      organization_id: organizationId,
      name: contactName,
      email: email || null,
    }).select("id").single();

    if (error) {
      logger.error({ message: "Failed to create client in webhook", error: error.message, organization_id: organizationId, context: "quickbooks-webhook-client-creation" });
      return;
    }
    clientRecord = newClient;
  }

  const payload = {
    organization_id: organizationId,
    client_id: clientRecord.id,
    amount: totalAmount,
    currency: String(invoice.CurrencyRef?.value ?? "USD"),
    due_date: toIsoDate(invoice.DueDate),
    status: status,
    quickbooks_id: invoice.Id,
    invoice_number: invoice.DocNumber || null,
    reference: null, // Add if Quickbooks supports tracking reference per invoice
    payment_link: invoice.InvoiceLink || null, // If QB supplies payment link
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("invoices")
    .select("id, updated_at")
    .eq("organization_id", organizationId)
    .eq("quickbooks_id", invoice.Id)
    .maybeSingle();

  if (existing) {
    const duelyUpdatedDate = new Date(existing.updated_at || 0);
    const qbUpdatedDate = invoice.MetaData?.LastUpdatedTime ? new Date(invoice.MetaData.LastUpdatedTime) : new Date(0);

    if (duelyUpdatedDate > qbUpdatedDate) {
      return; // Skip, Duely is newer
    }

    await supabase.from("invoices").update(payload).eq("id", existing.id);
    if (status === "paid") {
      await inngest.send({ name: "invoice.paid", data: { entityId: existing.id } });
    }
  } else {
    if (totalAmount > 0) {
      const { data: newInvoice } = await supabase.from("invoices").insert(payload).select("id").single();
      if (newInvoice && status === "paid") {
        await inngest.send({ name: "invoice.paid", data: { entityId: newInvoice.id } });
      }
    }
  }
}

async function upsertPayment(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  payment: Record<string, unknown> & { Id?: string; TxnDate?: string; CurrencyRef?: { value?: string }; Line?: Array<Record<string, unknown> & { Amount?: number; LinkedTxn?: Array<{ TxnType?: string; TxnId?: string }> }> }
) {
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("reference_id", payment.Id)
    .maybeSingle();

  if (existingPayment) {
    return;
  }

  const paymentDate = toIsoDate(payment.TxnDate) || new Date().toISOString().substring(0, 10);
  const currency = payment.CurrencyRef?.value || "USD";

  if (payment.Line && Array.isArray(payment.Line)) {
    for (const line of payment.Line) {
      const amount = Number(line.Amount || 0);
      if (amount <= 0) continue;

      const linkedTxn = line.LinkedTxn?.find((txn: Record<string, unknown> & { TxnType?: string }) => txn.TxnType === "Invoice");
      if (!linkedTxn || !linkedTxn.TxnId) continue;

      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("quickbooks_id", linkedTxn.TxnId)
        .maybeSingle();

      if (!existingInvoice) continue;

      // Soft-deduplication logic matching Xero
      const { data: softMatchedPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("invoice_id", existingInvoice.id)
        .eq("amount", amount)
        .eq("payment_date", paymentDate)
        .is("reference_id", null)
        .maybeSingle();

      if (softMatchedPayment) {
        await supabase.from("payments").update({ reference_id: payment.Id, payment_method: "quickbooks_sync" }).eq("id", softMatchedPayment.id);
        continue;
      }

      await supabase.from("payments").insert({
        organization_id: organizationId,
        invoice_id: existingInvoice.id,
        amount: amount,
        currency: currency,
        payment_date: paymentDate,
        payment_method: "quickbooks_sync",
        reference_id: payment.Id,
      });
    }
  }
}
