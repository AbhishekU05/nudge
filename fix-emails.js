const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const env = fs.readFileSync(".env.local", "utf-8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1];

const supabase = createClient(url, key);

async function run() {
  // Fetch all clients
  const { data: clients } = await supabase.from("clients").select("id, email");
  
  // Fetch all invoices
  const { data: invoices } = await supabase.from("invoices").select("id, customer_id, recipient_email");

  for (const client of clients) {
    const clientInvoices = invoices.filter(inv => inv.customer_id === client.id);
    
    // Find all non-null emails across client and invoices
    const emails = new Set();
    if (client.email) emails.add(client.email);
    for (const inv of clientInvoices) {
      if (inv.recipient_email) emails.add(inv.recipient_email);
    }
    
    if (emails.size > 1) {
      console.log(`Client ${client.id} has conflicting emails:`, Array.from(emails));
      // Just pick the first one and sync to all
      const bestEmail = Array.from(emails)[0];
      console.log(`Fixing Client ${client.id} to use ${bestEmail}`);
      
      await supabase.from("clients").update({ email: bestEmail }).eq("id", client.id);
      await supabase.from("invoices").update({ recipient_email: bestEmail }).eq("customer_id", client.id);
    } else if (emails.size === 1) {
      const bestEmail = Array.from(emails)[0];
      if (client.email !== bestEmail) {
        console.log(`Syncing Client ${client.id} to ${bestEmail}`);
        await supabase.from("clients").update({ email: bestEmail }).eq("id", client.id);
      }
      for (const inv of clientInvoices) {
        if (inv.recipient_email !== bestEmail) {
          console.log(`Syncing Invoice ${inv.id} to ${bestEmail}`);
          await supabase.from("invoices").update({ recipient_email: bestEmail }).eq("id", inv.id);
        }
      }
    }
  }
  
  console.log("Done syncing emails.");
}

run();
