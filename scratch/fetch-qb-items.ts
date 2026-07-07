import { createClient } from "@supabase/supabase-js";

async function fetchItems() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: rawIntegration } = await supabase.from("integrations").select("*").eq("provider", "quickbooks").limit(1).single();
  if (!rawIntegration) return;

  const baseUrl = process.env.QUICKBOOKS_ENVIRONMENT === "sandbox" || !process.env.QUICKBOOKS_CLIENT_ID?.startsWith("AB")
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";

  const query = `select * from Item maxresults 5`;
  const url = new URL(`${baseUrl}/v3/company/${rawIntegration.realm_id}/query?minorversion=65&query=${encodeURIComponent(query)}`);

  const response = await fetch(url.toString(), {
    headers: { "Accept": "application/json", "Authorization": `Bearer ${rawIntegration.access_token}` },
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
fetchItems().catch(console.error);
