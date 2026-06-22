import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error(userError);
    return;
  }
  const user = users.users.find(u => u.email === "a.upadhya05@gmail.com");
  if (user) {
    const { data: invoices } = await supabase.from("invoices").select("invoice_number, recipient_name, amount_owed, workflow_status, active, xero_invoice_id, quickbooks_invoice_id").eq("user_id", user.id);
    console.log("Invoices count:", invoices?.length);
    console.log("Invoices:", invoices?.map(i => `${i.invoice_number} - ${i.recipient_name} - ${i.workflow_status}`));
  }
}
run();
