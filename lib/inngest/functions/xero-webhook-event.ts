import { inngest } from "@/lib/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidXeroClient, getXeroIntegrationByTenant, fetchXeroInvoice, getWorkflowStatus, getInvoiceTotal, toIsoDate, normalizeEmail, withXeroRetry } from "@/lib/xero";
import { logger } from "@/lib/logger";
import type { Invoice as XeroInvoice } from "xero-node";

// Moved verbatim from app/api/webhooks/xero/route.ts — the route now only
// verifies the webhook signature and hands each event off here so it can
// ack Xero within its 5-second window regardless of how long the actual
// Xero API fetch + upserts take. Logic itself is unchanged.
export const xeroWebhookEvent = inngest.createFunction(
  {
    id: "xero-webhook-event",
    retries: 3,
    concurrency: {
      limit: 1,
      key: "event.data.resourceId",
    },
    triggers: [{ event: "xero/webhook.event.received" }],
  },
  async ({ event }) => {
    const xeroEvent = event.data as {
      eventId: string;
      tenantId: string;
      resourceId: string;
      eventCategory: string;
      eventType: string;
    };

    const supabase = createSupabaseAdminClient();
    const eventId = xeroEvent.eventId;

    // Idempotency check
    const { data: existingEvent } = await supabase
      .from("webhook_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();

    if (existingEvent) {
      return { skipped: true, reason: "already_processed" }; // Already processed
    }

    const tenantId = xeroEvent.tenantId;
    const resourceId = xeroEvent.resourceId;
    const eventCategory = xeroEvent.eventCategory;
    const eventType = xeroEvent.eventType;

    // The event is only marked processed once we reach a settled outcome
    // below (synced, or determined there's nothing to sync) - not up front.
    // A transient failure (rate limit, network error) throws before this
    // runs, so Inngest's retry actually re-attempts the Xero call instead of
    // finding the marker already there on retry and silently no-op'ing.
    const markProcessed = async () => {
      const { error } = await supabase.from("webhook_events").insert({
        id: eventId,
        type: `xero_${eventCategory}_${eventType}`,
      });
      // 23505 = a concurrent redelivery inserted the same event id first;
      // that's the idempotency guarantee working, not a failure. Any other
      // error means the marker didn't land, so surface it and let Inngest
      // retry rather than silently claiming the event was processed.
      if (error && error.code !== "23505") throw error;
    };

    const integration = await getXeroIntegrationByTenant(tenantId);
    if (!integration) {
      logger.external({ service: "Xero", action: "webhook_sync", success: false, error: "Received webhook for unknown tenant", organization_id: tenantId });
      await markProcessed();
      return { skipped: true, reason: "unknown_tenant" };
    }

    await getValidXeroClient(integration);

    if (eventCategory === "INVOICE") {
      let invoice: XeroInvoice | undefined;
      try {
        const result = await withXeroRetry(integration, async (client, intg) => {
          return fetchXeroInvoice(client, intg.tenant_id, resourceId);
        });
        invoice = result.result;
      } catch (error) {
        const statusCode = (error as { response?: { statusCode?: number } })?.response?.statusCode;
        if (statusCode === 400 || statusCode === 404) {
          // Invoice no longer exists on Xero's side (e.g. a draft that was
          // deleted before ever being authorised) - nothing to sync, and
          // retrying can never succeed, so this is a settled outcome, not a
          // transient failure.
          logger.external({ service: "Xero", action: "webhook_invoice_fetch", success: false, error: `Invoice ${resourceId} not found (${statusCode})`, organization_id: integration.organization_id });
          await markProcessed();
          return { skipped: true, reason: "invoice_not_found" };
        }
        throw error;
      }

      // DRAFT/SUBMITTED invoices are deliberately excluded here too - see the
      // matching Statuses filter in lib/xero.ts's syncXeroDataPageForOrg for why.
      const allowedStatuses = ["AUTHORISED", "PAID", "VOIDED"];
      if (invoice && invoice.invoiceID && String(invoice.type) === "ACCREC" && allowedStatuses.includes(String(invoice.status))) {
        await upsertInvoice(supabase, integration.organization_id, invoice);

        // Xero doesn't send PAYMENT webhooks natively. Payments trigger an INVOICE update.
        // We extract all payments attached to this invoice and sync them.
        if (invoice.payments && invoice.payments.length > 0) {
          for (const payment of invoice.payments) {
            // invoice.payments typically contains simplified payment objects.
            // We can upsert them directly since they have paymentID, amount, and date.
            if (payment.paymentID) {
              const enrichedPayment = {
                ...payment,
                invoice: { invoiceID: invoice.invoiceID, currencyCode: invoice.currencyCode as string | undefined },
              };
              await upsertPayment(supabase, integration.organization_id, enrichedPayment as unknown as Parameters<typeof upsertPayment>[2]);
            }
          }
        }
      }
    }

    // Update last_synced_at
    await supabase
      .from("integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("organization_id", integration.organization_id)
      .eq("provider", "xero");

    await markProcessed();
    return { success: true };
  }
);

async function upsertInvoice(
  supabase: ReturnType<typeof import("@/lib/supabase/admin").createSupabaseAdminClient>,
  organizationId: string,
  invoice: XeroInvoice
) {
  const amountOwed = getInvoiceTotal(invoice);

  // Find or create client
  const email = normalizeEmail(invoice.contact?.emailAddress);
  const contactName = invoice.contact?.name || "Unknown";

  let clientRecord = null;

  // Try by email
  if (email) {
    const { data } = await supabase.from("clients").select("id").eq("organization_id", organizationId).eq("email", email).maybeSingle();
    if (data) clientRecord = data;
  }

  // Try by name
  if (!clientRecord) {
    const { data } = await supabase.from("clients").select("id").eq("organization_id", organizationId).eq("name", contactName).maybeSingle();
    if (data) clientRecord = data;
  }

  if (!clientRecord) {
    const { data: newClient, error } = await supabase
      .from("clients")
      .insert({ organization_id: organizationId, name: contactName, email })
      .select("id")
      .single();

    if (error) throw error;
    clientRecord = newClient;
  }

  const status = getWorkflowStatus(invoice);

  // payment_link is deliberately omitted here: it's only ever populated
  // lazily by the client portal (on first access, if missing), not fetched
  // proactively on every webhook sync. Omitting the key (rather than setting
  // it to null) means an .update() below leaves an existing portal-fetched
  // link untouched instead of wiping it out on the next webhook event.
  const payload = {
    organization_id: organizationId,
    client_id: clientRecord.id,
    amount: amountOwed,
    currency: String(invoice.currencyCode ?? "USD"),
    due_date: toIsoDate(invoice.dueDate),
    status: status,
    xero_id: invoice.invoiceID,
    invoice_number: invoice.invoiceNumber || null,
    reference: invoice.reference || null,
    updated_at: new Date().toISOString(),
  };

  // Find existing invoice
  const { data: existing } = await supabase
    .from("invoices")
    .select("id, updated_at")
    .eq("organization_id", organizationId)
    .eq("xero_id", invoice.invoiceID)
    .maybeSingle();

  if (existing) {
    const duelyUpdatedDate = new Date(existing.updated_at || 0);
    const xeroUpdatedDate = invoice.updatedDateUTC ? new Date(invoice.updatedDateUTC) : new Date(0);

    if (duelyUpdatedDate > xeroUpdatedDate) {
      return; // Skip, Duely is newer
    }

    await supabase.from("invoices").update(payload).eq("id", existing.id);
    if (status === "paid") {
      await inngest.send({ name: "invoice.paid", data: { entityId: existing.id } });
    }
  } else {
    if (amountOwed > 0) {
      // Don't insert if amount <= 0
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
  payment: {
    paymentID: string;
    amount?: number;
    date?: string;
    invoice?: { invoiceID: string; currencyCode?: string };
  }
) {
  // Check if payment already exists
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("reference_id", payment.paymentID)
    .maybeSingle();

  if (existingPayment) {
    return; // Already exists
  }

  // Find parent invoice
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("xero_id", payment.invoice?.invoiceID)
    .maybeSingle();

  if (!existingInvoice) {
    return; // Invoice doesn't exist in Duely, skip
  }

  if (!payment.amount || payment.amount <= 0) return;

  const paymentDate = toIsoDate(payment.date) || new Date().toISOString().substring(0, 10);

  // Soft-deduplication: check if a manual payment for the same amount and date exists without a reference_id
  const { data: softMatchedPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("invoice_id", existingInvoice.id)
    .eq("amount", payment.amount)
    .eq("payment_date", paymentDate)
    .is("reference_id", null)
    .maybeSingle();

  if (softMatchedPayment) {
    // It's a manual payment we pushed, just update its reference_id
    await supabase.from("payments").update({ reference_id: payment.paymentID, payment_method: "xero_sync" }).eq("id", softMatchedPayment.id);
    return;
  }

  await supabase.from("payments").insert({
    organization_id: organizationId,
    invoice_id: existingInvoice.id,
    amount: payment.amount,
    currency: payment.invoice?.currencyCode || "USD",
    payment_date: paymentDate,
    payment_method: "xero_sync",
    reference_id: payment.paymentID,
  });

  // Re-fetch Xero invoice and update status if needed
  // Alternatively, the invoice webhook might fire alongside this payment webhook.
}
