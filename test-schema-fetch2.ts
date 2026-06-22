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
  const { data: e, error } = await supabase.from('customer_events').insert({
    user_id: 'd9b2d63d-a233-4123-8478-0a0000000000', // Need a valid user id or it might fail fkey constraint. 
    // I'll just check information_schema using rpc or another way.
  });
}
