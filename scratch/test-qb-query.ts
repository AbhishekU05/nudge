import { createSupabaseAdminClient } from "../lib/supabase/admin";
import { getValidQuickBooksTokens, getApiBaseUrl } from "../lib/quickbooks";
import fetch from "node-fetch";

async function run() {
  const supabase = createSupabaseAdminClient();
  const { data: intg } = await supabase.from("integrations").select("*").eq("provider", "quickbooks").limit(1).single();
  const valid = await getValidQuickBooksTokens(intg);
  
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const dateStr = twoYearsAgo.toISOString().split('T')[0];

  const q1 = `select * from Invoice where Balance > '0'`;
  const q2 = `select * from Invoice where Balance = '0' and TxnDate >= '${dateStr}'`;
  
  for (const query of [q1, q2]) {
    const url = new URL(`${await getApiBaseUrl()}/v3/company/${intg.realm_id}/query`);
    url.searchParams.set("query", query);
    url.searchParams.set("minorversion", "65");
    const res = await fetch(url.toString(), {
      headers: { "Accept": "application/json", "Authorization": `Bearer ${valid.access_token}` }
    });
    const text = await res.text();
    console.log(`Query: ${query} => Status: ${res.status}`);
    if (!res.ok) console.log(text);
  }
}
run();
