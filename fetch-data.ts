import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) throw userError;
  const user = users.users.find(u => u.email === 'a.upadhya05@gmail.com');
  if (!user) {
    console.error('User not found');
    return;
  }
  const userId = user.id;
  
  const { data: clients } = await supabase.from('clients').select('*').eq('user_id', userId);
  const { data: invoices } = await supabase.from('invoices').select('*').eq('user_id', userId);
  const { data: events } = await supabase.from('events').select('*, clients(name, email), invoices(recipient_name)').eq('user_id', userId);
  const { data: groups } = await supabase.from('groups').select('*').eq('user_id', userId);
  
  const output = {
    clients,
    invoices,
    events,
    groups
  };
  
  console.log(JSON.stringify(output, null, 2));
}

main().catch(console.error);
