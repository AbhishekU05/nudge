import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { getValidQuickBooksTokens, QuickBooksIntegrationRow, getApiBaseUrl } from "./quickbooks";

export async function createQuickBooksLateFeeInvoice(
  organizationId: string,
  originalInvoiceNumber: string,
  feeAmount: number,
  contactName: string,
  email: string
) {
  const supabase = createSupabaseAdminClient();
  const { data: rawIntegration } = await supabase.from("integrations").select("*").eq("organization_id", organizationId).eq("provider", "quickbooks").single();
  
  if (!rawIntegration || !rawIntegration.realm_id) return null;

  const integration = await getValidQuickBooksTokens(rawIntegration as QuickBooksIntegrationRow);

  // We need to resolve the customer. For simplicity, we assume we fetch the Customer by email or name.
  // We'll create the invoice with a generic line item.
  // In a real scenario, we'd need the exact QuickBooks CustomerRef, which we might fetch here.
  const query = `select * from Customer where PrimaryEmailAddr = '${email.replace(/'/g, "''")}'`;
  const baseUrl = await getApiBaseUrl();
  const url = new URL(`${baseUrl}/v3/company/${integration.realm_id}/query`);
  url.searchParams.set("query", query);
  url.searchParams.set("minorversion", "65");

  const response = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${integration.access_token}`,
    },
  });
  
  let customerRef = null;
  if (response.ok) {
    const data = await response.json();
    if (data.QueryResponse?.Customer && data.QueryResponse.Customer.length > 0) {
      customerRef = data.QueryResponse.Customer[0].Id;
    }
  }

  if (!customerRef) return null; // We can't create an invoice without a valid customerRef in QB

  const newInvoice = {
    CustomerRef: {
      value: customerRef
    },
    Line: [
      {
        Amount: feeAmount,
        DetailType: "SalesItemLineDetail",
        SalesItemLineDetail: {
          ItemRef: {
            value: "1", // Generic item, ideally should be configurable
            name: "Services"
          },
          UnitPrice: feeAmount,
          Qty: 1
        },
        Description: `Late fee for invoice ${originalInvoiceNumber}`
      }
    ]
  };

  const createUrl = new URL(`${baseUrl}/v3/company/${integration.realm_id}/invoice`);
  createUrl.searchParams.set("minorversion", "65");

  const createResponse = await fetch(createUrl.toString(), {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${integration.access_token}`,
    },
    body: JSON.stringify(newInvoice)
  });

  if (!createResponse.ok) return null;
  const createData = await createResponse.json();
  return createData.Invoice?.Id || null;
}

export async function updateQuickBooksInvoiceWithLateFee(
  organizationId: string,
  invoiceId: string,
  feeAmount: number
) {
  const supabase = createSupabaseAdminClient();
  const { data: rawIntegration } = await supabase.from("integrations").select("*").eq("organization_id", organizationId).eq("provider", "quickbooks").single();
  
  if (!rawIntegration || !rawIntegration.realm_id) return null;

  const integration = await getValidQuickBooksTokens(rawIntegration as QuickBooksIntegrationRow);

  const baseUrl = await getApiBaseUrl();
  // 1. Fetch the existing invoice from QuickBooks
  const url = new URL(`${baseUrl}/v3/company/${integration.realm_id}/invoice/${invoiceId}`);
  url.searchParams.set("minorversion", "65");

  const response = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${integration.access_token}`,
    },
  });

  if (!response.ok) return null;
  const data = await response.json();
  const invoice = data.Invoice;
  if (!invoice) return null;

  // 2. Append late fee line item
  const newLineItem = {
    Amount: feeAmount,
    DetailType: "SalesItemLineDetail",
    SalesItemLineDetail: {
      ItemRef: {
        value: "1", // Needs an item ID in QB
        name: "Services"
      },
      UnitPrice: feeAmount,
      Qty: 1
    },
    Description: "Late Payment Fee"
  };

  // QB requires SyncToken to update an entity
  const updatePayload = {
    sparse: true,
    Id: invoice.Id,
    SyncToken: invoice.SyncToken,
    Line: [
      ...(invoice.Line || []),
      newLineItem
    ]
  };

  const updateResponse = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${integration.access_token}`,
    },
    body: JSON.stringify(updatePayload)
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    console.error("QB Update Error:", errorText);
    return null;
  }
  
  const updateData = await updateResponse.json();
  return updateData.Invoice?.Id || null;
}
