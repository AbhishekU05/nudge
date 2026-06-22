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
  const { data: xero } = await supabase.from('integrations').select('*').eq('provider', 'xero');
  const { data: qb } = await supabase.from('integrations').select('*').eq('provider', 'quickbooks');
  console.log("Xero connections:", xero?.length);
  console.log("QB connections:", qb?.length);
}
check().catch(console.error);
