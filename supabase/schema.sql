-- Duely Supabase schema
-- Canonical schema for a fresh database. Existing databases should apply the
-- numbered migrations in supabase/migrations/.

-- Extensions
create extension if not exists "pgcrypto";

-- Helper: updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- User-owned billing, referral, and email-provider metadata.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  razorpay_customer_id text,
  razorpay_subscription_id text,
  razorpay_subscription_status text,
  razorpay_renews_at timestamptz,

  referral_source text,
  google_access_token text,
  google_refresh_token text,
  gmail_connected_email text,
  gmail_oauth_state text
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Customer balance records plus optional reminder automation state.
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  recipient_name text not null,
  recipient_email text not null,
  amount_owed numeric(12,2) not null check (amount_owed > 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  currency text not null default 'USD',
  due_date date,

  workflow_status text not null default 'outstanding'
    check (workflow_status in (
      'outstanding',
      'promised',
      'partial',
      'paid',
      'overdue',
      'written_off'
    )),

  promised_date date,
  promise_notes text,
  internal_notes text,

  custom_message text,
  payment_link text,
  client_paid_at timestamptz,

  reminder_frequency_days int not null default 7 check (reminder_frequency_days >= 1),
  next_send_at timestamptz not null,
  last_sent_at timestamptz,
  active boolean not null default false,
  unsubscribed boolean not null default false,
  unsubscribe_token uuid not null default gen_random_uuid(),

  stripe_invoice_id text,
  xero_invoice_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_user_id_idx
  on public.customers(user_id);

create index if not exists customers_user_created_idx
  on public.customers(user_id, created_at desc);

create index if not exists customers_user_email_idx
  on public.customers(user_id, recipient_email);

create index if not exists customers_user_status_idx
  on public.customers(user_id, workflow_status)
  where unsubscribed = false;

create index if not exists customers_next_send_at_idx
  on public.customers(next_send_at)
  where active = true and unsubscribed = false;

create unique index if not exists customers_unsubscribe_token_idx
  on public.customers(unsubscribe_token);

create index if not exists customers_stripe_invoice_id_idx
  on public.customers(stripe_invoice_id)
  where stripe_invoice_id is not null;

create unique index if not exists customers_user_xero_invoice_id_idx
  on public.customers(user_id, xero_invoice_id)
;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

-- Unified customer timeline. Replaces separate payment_logs and followup_logs.
create table if not exists public.customer_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('payment', 'followup')),
  event_date date not null default current_date,

  amount numeric(12,2) check (amount is null or amount > 0),
  currency text,
  payment_source text check (
    payment_source is null or payment_source in ('user', 'customer', 'adjustment')
  ),

  followup_method text check (
    followup_method is null or followup_method in ('email', 'call', 'whatsapp', 'other')
  ),
  followup_outcome text check (
    followup_outcome is null or followup_outcome in (
      'no_response',
      'promise_made',
      'partial_payment',
      'paid_in_full'
    )
  ),
  note text,

  created_at timestamptz not null default now(),

  constraint customer_events_shape check (
    (
      event_type = 'payment'
      and amount is not null
      and currency is not null
      and payment_source is not null
      and followup_method is null
      and followup_outcome is null
    )
    or
    (
      event_type = 'followup'
      and amount is null
      and currency is null
      and payment_source is null
      and followup_method is not null
      and followup_outcome is not null
    )
  )
);

create index if not exists customer_events_customer_created_idx
  on public.customer_events(customer_id, created_at desc);

create index if not exists customer_events_user_created_idx
  on public.customer_events(user_id, created_at desc);

create index if not exists customer_events_user_type_created_idx
  on public.customer_events(user_id, event_type, created_at desc);

-- Simple usage events for rate limiting and abuse monitoring.
create table if not exists public.usage_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_type_created_idx
  on public.usage_events(user_id, event_type, created_at desc);

-- Stripe Connect/manual webhook configuration.
create table if not exists public.stripe_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_account_id text unique,
  access_token text,
  webhook_secret text,
  created_at timestamptz not null default now()
);

create index if not exists stripe_connections_webhook_configured_idx
  on public.stripe_connections(user_id)
  where webhook_secret is not null;

-- Third-party data sync integrations.
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

-- Landing-page lead capture.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx
  on public.leads(created_at desc);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.customer_events enable row level security;
alter table public.usage_events enable row level security;
alter table public.stripe_connections enable row level security;
alter table public.integrations enable row level security;
alter table public.leads enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Customer policies
drop policy if exists "customers_select_own" on public.customers;
create policy "customers_select_own"
on public.customers
for select
using (auth.uid() = user_id);

drop policy if exists "customers_insert_own" on public.customers;
create policy "customers_insert_own"
on public.customers
for insert
with check (auth.uid() = user_id);

drop policy if exists "customers_update_own" on public.customers;
create policy "customers_update_own"
on public.customers
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "customers_delete_own" on public.customers;
create policy "customers_delete_own"
on public.customers
for delete
using (auth.uid() = user_id);

-- Customer event policies
drop policy if exists "customer_events_select_own" on public.customer_events;
create policy "customer_events_select_own"
on public.customer_events
for select
using (auth.uid() = user_id);

drop policy if exists "customer_events_insert_own" on public.customer_events;
create policy "customer_events_insert_own"
on public.customer_events
for insert
with check (auth.uid() = user_id);

-- Usage event policies
drop policy if exists "usage_events_select_own" on public.usage_events;
create policy "usage_events_select_own"
on public.usage_events
for select
using (auth.uid() = user_id);

drop policy if exists "usage_events_insert_own" on public.usage_events;
create policy "usage_events_insert_own"
on public.usage_events
for insert
with check (auth.uid() = user_id);

-- Stripe connection policies
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

-- Integration policies
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

-- Lead policies. Inserts are public; reads are service-role only by absence of
-- a select policy.
drop policy if exists "leads_insert_anon" on public.leads;
create policy "leads_insert_anon"
on public.leads
for insert
with check (true);

drop policy if exists "leads_select_admin" on public.leads;

-- Auto-create profile rows on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, referral_source)
  values (
    new.id,
    new.raw_user_meta_data->>'referral_source'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
