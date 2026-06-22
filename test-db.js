const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key] = val.join('=').replace(/^"|"$/g, '');
  return acc;
}, {});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === "a.upadhya05@gmail.com");
  if (user) {
    const { data: invoices } = await supabase.from("invoices").select("invoice_number, recipient_name, amount_owed, amount_paid, workflow_status, active, xero_invoice_id").eq("user_id", user.id);
    console.log("Invoices count:", invoices?.length);
    if (invoices?.length > 0) {
      console.log(invoices.map(i => `${i.invoice_number} - ${i.recipient_name} - ${i.workflow_status} - owed: ${i.amount_owed} - paid: ${i.amount_paid}`));
    }
  }
}
run();
