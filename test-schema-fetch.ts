import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {} as Record<string, string>);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);
async function check() {
  const { data: i } = await supabase.from('invoices').select('*').limit(1);
  const { data: c } = await supabase.from('clients').select('*').limit(1);
  const { data: e } = await supabase.from('customer_events').select('*').limit(1);
  console.log("invoices columns:", i ? Object.keys(i[0] || {}) : "no data");
  console.log("clients columns:", c ? Object.keys(c[0] || {}) : "no data");
  console.log("events columns:", e ? Object.keys(e[0] || {}) : "no data");
}
check();
