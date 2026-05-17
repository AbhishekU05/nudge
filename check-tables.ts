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
  const { data, error } = await supabase.from('leads').select('*').limit(1);
  console.log('leads:', { data, error });
  
  const { data: d2, error: e2 } = await supabase.from('waitlist').select('*').limit(1);
  console.log('waitlist:', { data: d2, error: e2 });
  
  const { data: d3, error: e3 } = await supabase.from('subscribers').select('*').limit(1);
  console.log('subscribers:', { data: d3, error: e3 });
}
check();
