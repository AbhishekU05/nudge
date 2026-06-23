"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function promiseToPayAction(
  invoiceId: string,
  promisedDate: string,
  token: string
) {
  const supabase = createSupabaseAdminClient();

  // Validate token to ensure authorization
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("unsubscribe_token", token)
    .single();

  if (!client) {
    throw new Error("Unauthorized");
  }

  // Ensure the invoice belongs to this client
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, user_id, customer_id")
    .eq("id", invoiceId)
    .eq("customer_id", client.id)
    .single();

  if (!invoice) {
    throw new Error("Invoice not found or unauthorized");
  }

  // Update promised_date on invoice
  await supabase
    .from("invoices")
    .update({ 
      promised_date: promisedDate,
      workflow_status: "promised" 
    })
    .eq("id", invoiceId);

  // Add event
  await supabase
    .from("customer_events")
    .insert({
      customer_id: client.id,
      invoice_id: invoiceId,
      user_id: invoice.user_id,
      event_type: "followup",
      event_date: new Date().toISOString(),
      followup_method: "other",
      followup_outcome: "promise_made",
      note: `Client promised to pay by ${new Date(promisedDate).toLocaleDateString()}`
    });

  revalidatePath(`/portal/${token}`);
}
