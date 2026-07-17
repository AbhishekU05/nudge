import "server-only";
import { Invoice, LineAmountTypes } from "xero-node";
import { getValidXeroClient, XeroIntegrationRow } from "./xero";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createXeroLateFeeInvoice(
  organizationId: string, 
  originalInvoiceNumber: string, 
  feeAmount: number, 
  contactName: string,
  email: string,
  dueDate?: string,
  taxTreatment: "no_tax" | "exclusive" | "inclusive" = "no_tax",
) {
  const supabase = createSupabaseAdminClient();
  const { data: integration } = await supabase.from("integrations").select("*").eq("organization_id", organizationId).eq("provider", "xero").single();
  
  if (!integration) return null;
  const { xero } = await getValidXeroClient(integration as XeroIntegrationRow);
  const tenantId = integration.tenant_id;
  if (!tenantId) return null;

  const newInvoice: Invoice = {
    type: Invoice.TypeEnum.ACCREC,
    contact: {
      name: contactName,
      emailAddress: email
    },
    date: new Date().toISOString().split("T")[0],
    dueDate: dueDate || new Date().toISOString().split("T")[0],
    // Per policy: no_tax charges the fee exactly; exclusive adds the account's
    // default tax on top; inclusive treats the fee as tax-inclusive.
    lineAmountTypes:
      taxTreatment === "exclusive"
        ? LineAmountTypes.Exclusive
        : taxTreatment === "inclusive"
          ? LineAmountTypes.Inclusive
          : LineAmountTypes.NoTax,
    lineItems: [
      {
        description: `Late fee for invoice ${originalInvoiceNumber}`,
        quantity: 1,
        unitAmount: feeAmount,
        accountCode: "200"
      }
    ],
    status: Invoice.StatusEnum.AUTHORISED
  };

  const response = await xero.accountingApi.createInvoices(tenantId, { invoices: [newInvoice] });
  return response.body.invoices?.[0]?.invoiceID || null;
}

