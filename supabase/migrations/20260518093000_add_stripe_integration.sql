create table if not exists public.stripe_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_account_id text not null unique,
  access_token text not null,
  created_at timestamptz not null default now()
);

alter table public.stripe_connections enable row level security;

drop policy if exists "stripe_connections_select_own" on public.stripe_connections;
create policy "stripe_connections_select_own"
on public.stripe_connections
for select
using (auth.uid() = user_id);

drop policy if exists "stripe_connections_insert_own" on public.stripe_connections;
create policy "stripe_connections_insert_own"
on public.stripe_connections
for insert
with check (auth.uid() = user_id);

drop policy if exists "stripe_connections_update_own" on public.stripe_connections;
create policy "stripe_connections_update_own"
on public.stripe_connections
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.reminders
  add column if not exists stripe_invoice_id text;

alter table public.reminders
  add column if not exists paid boolean not null default false;

create index if not exists reminders_stripe_invoice_id_idx
  on public.reminders(stripe_invoice_id)
  where stripe_invoice_id is not null;
