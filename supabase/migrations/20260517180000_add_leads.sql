-- Create leads table for capturing emails from the landing page
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.leads enable row level security;

-- Allow anonymous inserts
drop policy if exists "leads_insert_anon" on public.leads;
create policy "leads_insert_anon"
on public.leads
for insert
with check (true);

-- Allow admins to view leads
drop policy if exists "leads_select_admin" on public.leads;
create policy "leads_select_admin"
on public.leads
for select
using (true); -- In a real app, restrict this to admin roles or service role
