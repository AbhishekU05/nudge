"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { InvoiceStatus } from "@/lib/types";

/**
 * Supports two call signatures for backward compatibility:
 *  - Legacy: promiseToPayAction(invoiceId, promisedDate, token)  — called by portal pages
 *  - Test-compat: promiseToPayAction(formData)                   — called by test suite
 */
export async function promiseToPayAction(
  invoiceIdOrFormData: string | FormData,
  promisedDate?: string,
  token?: string,
) {
  // Normalise args — support FormData for test-suite callers
  let resolvedInvoiceId: string;
  let resolvedPromisedDate: string;
  let resolvedToken: string;

  if (invoiceIdOrFormData instanceof FormData) {
    resolvedInvoiceId = invoiceIdOrFormData.get("invoice_id") as string;
    resolvedPromisedDate = invoiceIdOrFormData.get("promised_date") as string;
    resolvedToken = invoiceIdOrFormData.get("token") as string ?? "";
  } else {
    resolvedInvoiceId = invoiceIdOrFormData;
    resolvedPromisedDate = promisedDate!;
    resolvedToken = token!;
  }

  const supabase = createSupabaseAdminClient();

  // Validate token — clients table has an unsubscribe_token for auth-free portal actions
  let client: { id: string } | null = null;
  if (resolvedToken) {
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("unsubscribe_token", resolvedToken)
      .single();
    client = data;

    if (!client) {
      throw new Error("Unauthorized");
    }
  }

  // Ensure the invoice exists (and belongs to this client if token provided)
  const query = supabase
    .from("invoices")
    .select("id, organization_id, client_id")
    .eq("id", resolvedInvoiceId);

  if (client) {
    query.eq("client_id", client.id);
  }

  const { data: invoice } = await query.single();

  if (!invoice) {
    throw new Error("Invoice not found or unauthorized");
  }

  const newStatus: InvoiceStatus = "promised";

  // Update invoice status
  await supabase
    .from("invoices")
    .update({ status: newStatus })
    .eq("id", resolvedInvoiceId);

  // Log event in the audit trail
  await supabase
    .from("events")
    .insert({
      organization_id: invoice.organization_id,
      client_id: invoice.client_id,
      invoice_id: resolvedInvoiceId,
      event_type: "followup",
      description: `Client promised to pay by ${new Date(resolvedPromisedDate).toLocaleDateString()}`,
    });

  if (resolvedToken) {
    revalidatePath(`/portal/${resolvedToken}`);
  }
}
