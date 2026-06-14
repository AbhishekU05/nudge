import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envStr = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(envStr.split("\n").filter(Boolean).map(l => {
  const [k, ...v] = l.split("=");
  return [k, v.join("=").replace(/"/g, '')];
}));

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, count, error } = await supabase
    .from('leads')
    .select('*', { count: 'exact' });
  console.log("Anon Leads:", data);
  console.log("Anon Count:", count);
  console.log("Anon Error:", error);
}

run();
