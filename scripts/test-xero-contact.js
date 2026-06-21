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

  // Fetch single contact
  const res = await fetch(`https://api.xero.com/api.xro/2.0/Contacts/5b96e86b-418e-48e8-8949-308c14aec278`, {
    headers: {
      "Authorization": `Bearer ${integration.access_token}`,
      "xero-tenant-id": integration.tenant_id,
      "Accept": "application/json"
    }
  });
  
  const data = await res.json();
  console.log("Contact details:", data.Contacts?.[0]?.EmailAddress);
  console.log("Full Contact:", data.Contacts?.[0]);
}

run();
