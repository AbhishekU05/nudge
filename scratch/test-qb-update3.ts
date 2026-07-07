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

  const updatePayload = {
    sparse: true,
    Id: qbInvoice.Id,
    SyncToken: qbInvoice.SyncToken,
    CustomerMemo: { value: "Updated memo for testing" }
  };

  const updateResponse = await fetch(url.toString(), {
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
