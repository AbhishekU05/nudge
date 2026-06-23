import "server-only";
import { getValidXeroClient } from "./xero";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createXeroLateFeeInvoice(
  userId: string, 
  originalInvoiceNumber: string, 
  feeAmount: number, 
  contactName: string, 
  email: string
) {
  const supabase = await createSupabaseServerClient();
  const { data: integration } = await supabase.from("integrations").select("*").eq("user_id", userId).eq("provider", "xero").single();
  
  if (!integration) return null;
  const { xero } = await getValidXeroClient(integration as any);
  const tenantId = integration.tenant_id;
  if (!tenantId) return null;

  // Create a new invoice for the late fee
  const newInvoice = {
    type: "ACCREC" as any,
    contact: {
      name: contactName,
      emailAddress: email
    },
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0], // Due immediately
    lineItems: [
      {
        description: `Late fee for invoice ${originalInvoiceNumber}`,
        quantity: 1,
        unitAmount: feeAmount,
        accountCode: "200" // Sales account - may need to be configurable
      }
    ],
    status: "AUTHORISED" as any
  };

  const response = await xero.accountingApi.createInvoices(tenantId, { invoices: [newInvoice] });
  return response.body.invoices?.[0]?.invoiceID || null;
}
