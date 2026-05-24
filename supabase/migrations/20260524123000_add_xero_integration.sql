-- Add Xero data sync integration support.

alter table public.customers
  add column if not exists xero_invoice_id text;

create unique index if not exists customers_user_xero_invoice_id_idx
  on public.customers(user_id, xero_invoice_id)
;

create table if not exists public.integrations (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('xero')),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  tenant_id text not null,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

create index if not exists integrations_provider_idx
  on public.integrations(provider);

create index if not exists integrations_provider_last_synced_idx
  on public.integrations(provider, last_synced_at);

drop trigger if exists integrations_set_updated_at on public.integrations;
create trigger integrations_set_updated_at
before update on public.integrations
for each row execute function public.set_updated_at();

alter table public.integrations enable row level security;

drop policy if exists "integrations_select_own" on public.integrations;
create policy "integrations_select_own"
on public.integrations
for select
using (auth.uid() = user_id);

drop policy if exists "integrations_insert_own" on public.integrations;
create policy "integrations_insert_own"
on public.integrations
for insert
with check (auth.uid() = user_id);

drop policy if exists "integrations_update_own" on public.integrations;
create policy "integrations_update_own"
on public.integrations
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "integrations_delete_own" on public.integrations;
create policy "integrations_delete_own"
on public.integrations
for delete
using (auth.uid() = user_id);
