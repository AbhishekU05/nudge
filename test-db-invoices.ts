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
  const { data: invoices, error } = await supabase.from('invoices').select('*');
  console.log("Invoices in DB:", invoices?.length);
  const xeroInvoices = invoices?.filter(i => i.xero_invoice_id);
  console.log("Xero Invoices in DB:", xeroInvoices?.length);
}
check().catch(console.error);
