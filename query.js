import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { error } = await supabase.rpc('exec_sql', { query: `
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false NOT NULL;
    UPDATE public.profiles p SET is_admin = true FROM auth.users u WHERE p.user_id = u.id AND u.email = 'a.upadhya05@gmail.com';
  ` });
  console.log(error || 'Success');
}
run();
