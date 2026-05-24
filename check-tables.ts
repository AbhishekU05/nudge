import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {} as Record<string, string>);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = [
    'profiles',
    'customers',
    'customer_events',
    'usage_events',
    'stripe_connections',
    'integrations',
    'leads',
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log(`${table}:`, { data, error });
  }
}
check();
