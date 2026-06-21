import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("provider", "xero");

  if (error) {
    console.error("DB error:", error);
    return;
  }
  
  if (!integrations || integrations.length === 0) {
    console.log("No Xero integrations found in DB.");
    return;
  }

  for (const integration of integrations) {
    console.log(`User: ${integration.user_id}`);
    console.log(`Tenant: ${integration.tenant_id}`);
    console.log(`Expires: ${integration.expires_at}`);
    
    // Check if token is expired
    const isExpired = new Date(integration.expires_at).getTime() - Date.now() <= 5 * 60 * 1000;
    console.log(`Needs refresh: ${isExpired}`);
    
    // Attempt raw HTTP request using access token
    if (!isExpired) {
      console.log("Fetching invoices with current token...");
      try {
        const res = await fetch(`https://api.xero.com/api.xro/2.0/Invoices?where=Type%3D%3D%22ACCREC%22&Statuses=AUTHORISED%2CPAID`, {
          headers: {
            "Authorization": `Bearer ${integration.access_token}`,
            "xero-tenant-id": integration.tenant_id,
            "Accept": "application/json"
          }
        });
        
        const data = await res.json();
        if (data.Invoices) {
          console.log(`Found ${data.Invoices.length} invoices.`);
          for (const inv of data.Invoices.slice(0, 5)) {
            console.log(`Invoice: ${inv.InvoiceID} - ${inv.Status} - ${inv.Type}`);
            console.log(`Contact Email: ${inv.Contact?.EmailAddress || "MISSING"}`);
            console.log(`Total: ${inv.Total}, Due: ${inv.AmountDue}, Paid: ${inv.AmountPaid}`);
          }
        } else {
          console.log("Error or no invoices:", data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    } else {
      console.log("Token expired, cannot fetch without refresh.");
    }
  }
}

run();
