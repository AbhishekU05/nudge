-- Clean up the Supabase schema:
-- - Rename reminders to customers.
-- - Merge payment_logs and followup_logs into customer_events.
-- - Drop redundant/unused columns.
-- - Add missing indexes and tighten RLS policies.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.customers') is null
     and to_regclass('public.reminders') is not null then
    alter table public.reminders rename to customers;
  end if;
end;
$$;

alter table public.customers
  add column if not exists payment_link text,
  add column if not exists client_paid_at timestamptz,
  add column if not exists due_date date,
  add column if not exists amount_paid numeric(12,2) not null default 0,
  add column if not exists promised_date date,
  add column if not exists promise_notes text,
  add column if not exists workflow_status text not null default 'outstanding',
  add column if not exists internal_notes text,
  add column if not exists stripe_invoice_id text;

alter table public.customers
  alter column amount_paid set default 0,
  alter column workflow_status set default 'outstanding',
  alter column reminder_frequency_days set default 7,
  alter column active set default false,
  alter column unsubscribed set default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'customers'
      and column_name = 'paid'
  ) then
    update public.customers
    set
      workflow_status = 'paid',
      amount_paid = greatest(amount_paid, amount_owed),
      active = false
    where paid = true;
  end if;
end;
$$;

alter table public.customers
  drop column if exists paid,
  drop column if exists relationship_tag;

alter table public.customers
  drop constraint if exists reminders_min_interval;

do $$
begin
  alter index if exists reminders_user_id_idx rename to customers_user_id_idx;
exception when duplicate_table then null;
end;
$$;

do $$
begin
  alter index if exists reminders_next_send_at_idx rename to customers_next_send_at_idx;
exception when duplicate_table then null;
end;
$$;

do $$
begin
  alter index if exists reminders_unsubscribe_token_idx rename to customers_unsubscribe_token_idx;
exception when duplicate_table then null;
end;
$$;

do $$
begin
  alter index if exists reminders_workflow_status_idx rename to customers_user_status_idx;
exception when duplicate_table then null;
end;
$$;

do $$
begin
  alter index if exists reminders_stripe_invoice_id_idx rename to customers_stripe_invoice_id_idx;
exception when duplicate_table then null;
end;
$$;

drop trigger if exists reminders_set_updated_at on public.customers;
drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

do $$
begin
  alter table public.customers
    add constraint customers_amount_paid_nonnegative check (amount_paid >= 0);
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.customers
    add constraint customers_reminder_frequency_min check (reminder_frequency_days >= 1);
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter table public.customers
    add constraint customers_workflow_status_check check (
      workflow_status in (
        'outstanding',
        'promised',
        'partial',
        'paid',
        'overdue',
        'written_off'
      )
    );
exception when duplicate_object then null;
end;
$$;

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
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.customer_events
    add constraint customer_events_shape check (
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
    );
exception when duplicate_object then null;
end;
$$;

do $$
begin
  if to_regclass('public.payment_logs') is not null then
    insert into public.customer_events (
      id,
      customer_id,
      user_id,
      event_type,
      event_date,
      amount,
      currency,
      payment_source,
      created_at
    )
    select
      id,
      reminder_id,
      user_id,
      'payment',
      created_at::date,
      amount,
      currency,
      source,
      created_at
    from public.payment_logs
    on conflict (id) do nothing;
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.followup_logs') is not null then
    insert into public.customer_events (
      id,
      customer_id,
      user_id,
      event_type,
      event_date,
      followup_method,
      followup_outcome,
      note,
      created_at
    )
    select
      id,
      reminder_id,
      user_id,
      'followup',
      followup_date,
      method,
      outcome,
      note,
      created_at
    from public.followup_logs
    on conflict (id) do nothing;
  end if;
end;
$$;

drop table if exists public.payment_logs;
drop table if exists public.followup_logs;

create index if not exists customer_events_customer_created_idx
  on public.customer_events(customer_id, created_at desc);

create index if not exists customer_events_user_created_idx
  on public.customer_events(user_id, created_at desc);

create index if not exists customer_events_user_type_created_idx
  on public.customer_events(user_id, event_type, created_at desc);

create table if not exists public.usage_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_type_created_idx
  on public.usage_events(user_id, event_type, created_at desc);

alter table public.profiles
  add column if not exists referral_source text,
  add column if not exists google_access_token text,
  add column if not exists google_refresh_token text;

alter table public.stripe_connections
  add column if not exists webhook_secret text;

alter table public.stripe_connections
  alter column stripe_account_id drop not null,
  alter column access_token drop not null;

create index if not exists stripe_connections_webhook_configured_idx
  on public.stripe_connections(user_id)
  where webhook_secret is not null;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx
  on public.leads(created_at desc);

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.customer_events enable row level security;
alter table public.usage_events enable row level security;
alter table public.stripe_connections enable row level security;
alter table public.leads enable row level security;

drop policy if exists "reminders_select_own" on public.customers;
drop policy if exists "reminders_insert_own" on public.customers;
drop policy if exists "reminders_update_own" on public.customers;
drop policy if exists "reminders_delete_own" on public.customers;

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

drop policy if exists "leads_select_admin" on public.leads;
drop policy if exists "leads_insert_anon" on public.leads;
create policy "leads_insert_anon"
on public.leads
for insert
with check (true);
