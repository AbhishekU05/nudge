import "server-only";
import { getValidXeroClient } from "./xero";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createXeroLateFeeInvoice(
  organizationId: string, 
  originalInvoiceNumber: string, 
  feeAmount: number, 
  contactName: string, 
  email: string
) {
  const supabase = createSupabaseAdminClient();
  const { data: integration } = await supabase.from("integrations").select("*").eq("organization_id", organizationId).eq("provider", "xero").single();
  
  if (!integration) return null;
  const { xero } = await getValidXeroClient(integration as any);
  const tenantId = integration.tenant_id;
  if (!tenantId) return null;

  const newInvoice = {
    type: "ACCREC" as any,
    contact: {
      name: contactName,
      emailAddress: email
    },
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    lineItems: [
      {
        description: `Late fee for invoice ${originalInvoiceNumber}`,
        quantity: 1,
        unitAmount: feeAmount,
        accountCode: "200"
      }
    ],
    status: "AUTHORISED" as any
  };

  const response = await xero.accountingApi.createInvoices(tenantId, { invoices: [newInvoice] });
  return response.body.invoices?.[0]?.invoiceID || null;
}

export async function updateXeroInvoiceWithLateFee(
  organizationId: string,
  invoiceId: string,
  feeAmount: number
) {
  const supabase = createSupabaseAdminClient();
  const { data: integration } = await supabase.from("integrations").select("*").eq("organization_id", organizationId).eq("provider", "xero").single();
  
  if (!integration) return null;
  const { xero } = await getValidXeroClient(integration as any);
  const tenantId = integration.tenant_id;
  if (!tenantId) return null;

  // Fetch the existing invoice from Xero
  const response = await xero.accountingApi.getInvoice(tenantId, invoiceId);
  const invoice = response.body.invoices?.[0];
  if (!invoice) return null;

  // Xero requires the LineItems array to be completely replaced when updating.
  // We take the existing ones and push the late fee line item.
  const existingLineItems = invoice.lineItems || [];
  const updatedLineItems = [
    ...existingLineItems,
    {
      description: "Late Payment Fee",
      quantity: 1,
      unitAmount: feeAmount,
      accountCode: "200" // Default sales account
    }
  ];

  const updatePayload = {
    invoices: [
      {
        invoiceID: invoiceId,
        lineItems: updatedLineItems
      }
    ]
  };

  // POST to Invoices endpoint updates the invoice
  const updateResponse = await xero.accountingApi.updateOrCreateInvoices(tenantId, updatePayload);
  return updateResponse.body.invoices?.[0]?.invoiceID || null;
}
