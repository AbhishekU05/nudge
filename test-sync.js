const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data } = await supabase.from("auth.users").select("*").eq("email", "a.upadhya05@gmail.com");
  console.log("Users:", data);
  if (data && data.length > 0) {
    const { data: invoices } = await supabase.from("invoices").select("invoice_number, amount_owed, workflow_status, active").eq("user_id", data[0].id);
    console.log("Invoices:", invoices);
  }
}
run();
