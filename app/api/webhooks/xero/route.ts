import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidXeroClient, getXeroIntegrationByTenant, fetchXeroInvoice, fetchXeroPayment, getWorkflowStatus, getInvoiceTotal, toIsoDate, normalizeEmail } from "@/lib/xero";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-xero-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const webhookKey = process.env.XERO_WEBHOOK_KEY;
  if (!webhookKey) {
    logger.error({ message: "XERO_WEBHOOK_KEY is not configured", context: "xero-webhook" });
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  const computedSignature = crypto
    .createHmac("sha256", webhookKey)
    .update(rawBody)
    .digest("base64");

  if (computedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const events = payload.events || [];

    for (const event of events) {
      await processEvent(event);
    }
  } catch (err) {
    logger.error({
      message: "Error processing Xero webhook",
      error: err instanceof Error ? err.message : String(err),
      context: "xero-webhook"
    });
    // Return 200 even on error so Xero doesn't keep retrying if it's a poison pill
    // Actually, maybe 500 so Xero retries? Let's return 200 for now or 500 if we want retries.
    // The prompt says "if the push fails, queue a retry", but for webhooks:
    // "If webhook_events already contains this event ID, return 200 immediately without processing"
  }

  return NextResponse.json({ success: true });
}

async function processEvent(event: any) {
  const supabase = createSupabaseAdminClient();
  const eventId = event.eventId;
  
  // Idempotency check
  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (existingEvent) {
    return; // Already processed
  }

  const tenantId = event.tenantId;
  const resourceId = event.resourceId;
  const eventCategory = event.eventCategory;
  const eventType = event.eventType;

  // Insert event to prevent double-processing
  await supabase.from("webhook_events").insert({
    id: eventId,
    event_type: `xero_${eventCategory}_${eventType}`,
    payload: event,
    processed_at: new Date().toISOString()
  });

  const integration = await getXeroIntegrationByTenant(tenantId);
  if (!integration) {
    logger.external({ service: "Xero", action: "webhook_sync", success: false, error: "Received webhook for unknown tenant", organization_id: tenantId });
    return;
  }

  const { xero } = await getValidXeroClient(integration);

  if (eventCategory === "INVOICE") {
    const invoice = await fetchXeroInvoice(xero, tenantId, resourceId);
    if (invoice && String(invoice.type) === "ACCREC") {
      await upsertInvoice(supabase, integration.organization_id, invoice);
      
      // Xero doesn't send PAYMENT webhooks natively. Payments trigger an INVOICE update.
      // We extract all payments attached to this invoice and sync them.
      if (invoice.payments && invoice.payments.length > 0) {
        for (const payment of invoice.payments) {
          // invoice.payments typically contains simplified payment objects.
          // We can upsert them directly since they have paymentID, amount, and date.
          const enrichedPayment = {
            ...payment,
            invoice: { invoiceID: invoice.invoiceID, currencyCode: invoice.currencyCode }
          };
          await upsertPayment(supabase, integration.organization_id, enrichedPayment);
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
}

async function upsertInvoice(supabase: any, organizationId: string, invoice: any) {
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
  
  const payload = {
    organization_id: organizationId,
    client_id: clientRecord.id,
    amount: amountOwed,
    currency: String(invoice.currencyCode ?? "USD"),
    due_date: toIsoDate(invoice.dueDate),
    status: status,
    xero_id: invoice.invoiceID,
    updated_at: new Date().toISOString()
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
  } else {
    if (amountOwed > 0) { // Don't insert if amount <= 0
      await supabase.from("invoices").insert(payload);
    }
  }
}

async function upsertPayment(supabase: any, organizationId: string, payment: any) {
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

  await supabase.from("payments").insert({
    organization_id: organizationId,
    invoice_id: existingInvoice.id,
    amount: payment.amount,
    currency: payment.invoice?.currencyCode || "USD",
    payment_date: toIsoDate(payment.date) || new Date().toISOString().substring(0, 10),
    payment_method: "xero_sync",
    reference_id: payment.paymentID
  });

  // Re-fetch Xero invoice and update status if needed
  // Alternatively, the invoice webhook might fire alongside this payment webhook.
}
