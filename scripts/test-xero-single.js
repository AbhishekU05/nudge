import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: integrations } = await supabase
    .from("integrations")
    .select("*")
    .eq("provider", "xero")
    .limit(1);

  const integration = integrations[0];

  // Fetch single invoice
  const invRes = await fetch(`https://api.xero.com/api.xro/2.0/Invoices/fee88eea-f2aa-4a71-a372-33d6d83d3c45`, {
    headers: {
      "Authorization": `Bearer ${integration.access_token}`,
      "xero-tenant-id": integration.tenant_id,
      "Accept": "application/json"
    }
  });
  
  const invData = await invRes.json();
  console.log("Single invoice contact:", invData.Invoices?.[0]?.Contact);
}

run();
