import { createClient } from "@supabase/supabase-js";
import { getValidQuickBooksTokens, getApiBaseUrl } from "../lib/quickbooks";

async function testQB() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Finding invoices with QB IDs...");
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .not("quickbooks_id", "is", null)
    .in("status", ["outstanding", "partial", "overdue"])
    .limit(1);

  if (!invoices || invoices.length === 0) {
    console.log("No QB invoices found");
    return;
  }

  const invoice = invoices[0];
  console.log("Testing invoice:", invoice.id, "QB ID:", invoice.quickbooks_id);

  const organizationId = invoice.organization_id;
  const invoiceId = invoice.quickbooks_id;
  const feeAmount = 10;

  const { data: rawIntegration } = await supabase.from("integrations").select("*").eq("organization_id", organizationId).eq("provider", "quickbooks").single();
  if (!rawIntegration) {
    console.log("No integration found");
    return;
  }

  const integration = await getValidQuickBooksTokens(rawIntegration as any);
  console.log("Got valid tokens!");

  const baseUrl = await getApiBaseUrl();
  const url = new URL(`${baseUrl}/v3/company/${integration.realm_id}/invoice/${invoiceId}`);
  url.searchParams.set("minorversion", "65");

  console.log("Fetching invoice from QB:", url.toString());
  const response = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${integration.access_token}`,
    },
  });

  if (!response.ok) {
    console.error("Fetch failed:", response.status, await response.text());
    return;
  }
  
  const data = await response.json();
  const qbInvoice = data.Invoice;
  console.log("Got QB Invoice:", qbInvoice.Id, "TotalAmt:", qbInvoice.TotalAmt);

  const newLineItem = {
    Amount: feeAmount,
    DetailType: "SalesItemLineDetail",
    SalesItemLineDetail: {
      ItemRef: {
        value: "1", 
        name: "Services"
      },
      UnitPrice: feeAmount,
      Qty: 1
    },
    Description: "Late Payment Fee"
  };

  const updatePayload = {
    sparse: true,
    Id: qbInvoice.Id,
    SyncToken: qbInvoice.SyncToken,
    Line: [
      ...(qbInvoice.Line || []),
      newLineItem
    ]
  };

  console.log("Updating QB invoice...");
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
    console.error("QB Update Error:", await updateResponse.text());
  } else {
    console.log("Update Success!");
  }
}

testQB().catch(console.error);
