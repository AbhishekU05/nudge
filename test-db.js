import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envStr = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(envStr.split("\n").filter(Boolean).map(l => {
  const [k, ...v] = l.split("=");
  return [k, v.join("=").replace(/"/g, '')];
}));

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, count, error } = await supabase
    .from('leads')
    .select('*', { count: 'exact' });
  console.log("Leads:", data);
  console.log("Count:", count);
  console.log("Error:", error);
}

run();
