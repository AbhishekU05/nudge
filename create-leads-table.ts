import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile1 = fs.readFileSync('.env.example', 'utf8');
const env1 = envFile1.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {} as Record<string, string>);

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {} as Record<string, string>);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = env1.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  const { error } = await supabase.rpc('exec_sql', { sql: `
    create table if not exists public.leads (
      id uuid primary key default gen_random_uuid(),
      email text not null unique,
      created_at timestamptz not null default now()
    );
    alter table public.leads enable row level security;
    drop policy if exists "leads_insert_anon" on public.leads;
    create policy "leads_insert_anon" on public.leads for insert with check (true);
  ` });
  console.log('table created:', error || 'success');
}
createTable();
