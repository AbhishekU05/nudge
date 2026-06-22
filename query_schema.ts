import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: events, error } = await supabase.from('customer_events').select('*').limit(5);
  if (error) console.error(error);
  else console.log(JSON.stringify(events, null, 2));
}

run();
