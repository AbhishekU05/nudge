import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const res = await supabase.from("events").select("*, clients(name, email), invoices(clients(name, email))").limit(1);
  console.log("Events:", res.error || res.data);
  
  const res2 = await supabase.from("payments").select("*, invoices(clients(name, email))").limit(1);
  console.log("Payments:", res2.error || res2.data);
  
  const res3 = await supabase.from("invoices").select("*, clients(name, email)").limit(1);
  console.log("Invoices:", res3.error || res3.data);
}
run();
