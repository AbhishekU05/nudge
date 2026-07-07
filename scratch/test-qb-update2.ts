import { createClient } from "@supabase/supabase-js";

async function testQB() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: rawIntegration } = await supabase.from("integrations").select("*").eq("provider", "quickbooks").limit(1).single();
  const baseUrl = process.env.QUICKBOOKS_ENVIRONMENT === "sandbox" || !process.env.QUICKBOOKS_CLIENT_ID?.startsWith("AB") ? "https://sandbox-quickbooks.api.intuit.com" : "https://quickbooks.api.intuit.com";

  const { data: invoices } = await supabase.from("invoices").select("*").not("quickbooks_id", "is", null).limit(1);
  const invoiceId = invoices![0].quickbooks_id;

  const url = new URL(`${baseUrl}/v3/company/${rawIntegration!.realm_id}/invoice/${invoiceId}?minorversion=65`);
  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json", "Authorization": `Bearer ${rawIntegration!.access_token}` },
  });
  const qbInvoice = (await response.json()).Invoice;

  const itemQuery = `select * from Item where Type='Service' maxresults 1`;
  const itemRes = await fetch(`${baseUrl}/v3/company/${rawIntegration!.realm_id}/query?minorversion=65&query=${encodeURIComponent(itemQuery)}`, {
    headers: { "Accept": "application/json", "Authorization": `Bearer ${rawIntegration!.access_token}` },
  });
  const itemRef = (await itemRes.json()).QueryResponse.Item[0];

  let taxCodeRef = "NON";
  const firstLine = qbInvoice.Line?.find((l: any) => l.DetailType === "SalesItemLineDetail" && l.SalesItemLineDetail?.TaxCodeRef?.value);
  if (firstLine) {
    taxCodeRef = firstLine.SalesItemLineDetail.TaxCodeRef.value;
  }

  const newLineItem = {
    Amount: 10,
    DetailType: "SalesItemLineDetail",
    SalesItemLineDetail: {
      ItemRef: { value: itemRef.Id, name: itemRef.Name },
      UnitPrice: 10,
      Qty: 1,
      TaxCodeRef: { value: taxCodeRef }
    },
    Description: "Late Payment Fee"
  };

  const updatePayload = {
    sparse: true,
    Id: qbInvoice.Id,
    SyncToken: qbInvoice.SyncToken,
    TxnTaxDetail: qbInvoice.TxnTaxDetail,
    Line: [
      ...(qbInvoice.Line || []).filter((l: any) => l.DetailType !== "SubTotalLineDetail").map((l: any) => ({
        Id: l.Id,
        LineNum: l.LineNum,
        Amount: l.Amount,
        DetailType: l.DetailType,
        [l.DetailType]: l[l.DetailType],
        Description: l.Description
      })),
      newLineItem
    ]
  };

  console.log("Sending payload...");
  const updateUrl = new URL(`${baseUrl}/v3/company/${rawIntegration!.realm_id}/invoice?minorversion=65`);
  const updateResponse = await fetch(updateUrl.toString(), {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${rawIntegration!.access_token}` },
    body: JSON.stringify(updatePayload)
  });

  if (!updateResponse.ok) {
    console.error("QB Update Error:", await updateResponse.text());
  } else {
    console.log("Update Success!");
  }
}
testQB().catch(console.error);
