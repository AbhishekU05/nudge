import { syncXeroInvoicesForUser } from "./lib/xero";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email === "a.upadhya05@gmail.com");
  if (!user) {
    console.error("User not found");
    return;
  }
  console.log("Found user, running sync...");
  try {
    const result = await syncXeroInvoicesForUser(user.id);
    console.log("Sync result:", result);
  } catch (err) {
    console.error("Sync error:", err);
  }
}
run();
