-- Nudge: Supabase schema for recurring payment reminders
-- Apply this in the Supabase SQL editor.

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

-- Profiles for billing metadata
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  razorpay_customer_id text,
  razorpay_subscription_id text,
  razorpay_subscription_status text,
  razorpay_renews_at timestamptz
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Reminders
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  recipient_name text not null,
  recipient_email text not null,
  amount_owed numeric(12,2) not null check (amount_owed > 0),
  currency text not null default 'USD',
  custom_message text,
  payment_link text,
  client_paid_at timestamptz,

  reminder_frequency_days int not null check (reminder_frequency_days >= 1),
  next_send_at timestamptz not null,
  last_sent_at timestamptz,

  active boolean not null default true,
  unsubscribed boolean not null default false,

  unsubscribe_token uuid not null default gen_random_uuid(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Abuse prevention: enforce at least 24h between sends (frequency must be >= 1 day)
  constraint reminders_min_interval check (reminder_frequency_days >= 1)
);

alter table public.reminders
  add column if not exists payment_link text;

alter table public.reminders
  add column if not exists client_paid_at timestamptz;

create index if not exists reminders_user_id_idx on public.reminders(user_id);
create index if not exists reminders_next_send_at_idx on public.reminders(next_send_at) where active = true and unsubscribed = false;
create unique index if not exists reminders_unsubscribe_token_idx on public.reminders(unsubscribe_token);

drop trigger if exists reminders_set_updated_at on public.reminders;
create trigger reminders_set_updated_at
before update on public.reminders
for each row execute function public.set_updated_at();

-- Simple usage events for basic rate limiting / abuse monitoring
create table if not exists public.usage_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_type_created_idx
  on public.usage_events(user_id, event_type, created_at desc);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.reminders enable row level security;
alter table public.usage_events enable row level security;

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

-- Reminders policies (owner-only)
drop policy if exists "reminders_select_own" on public.reminders;
create policy "reminders_select_own"
on public.reminders
for select
using (auth.uid() = user_id);

drop policy if exists "reminders_insert_own" on public.reminders;
create policy "reminders_insert_own"
on public.reminders
for insert
with check (auth.uid() = user_id);

drop policy if exists "reminders_update_own" on public.reminders;
create policy "reminders_update_own"
on public.reminders
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "reminders_delete_own" on public.reminders;
create policy "reminders_delete_own"
on public.reminders
for delete
using (auth.uid() = user_id);

-- Usage events policies (owner-only)
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

-- Auto-create profile rows on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ============================================================
-- PHASE 1 MIGRATION: Workflow-first collections columns
-- Apply these in Supabase SQL editor. All are additive (no data loss).
-- ============================================================

-- Payment tracking: due date + partial payment support
alter table public.reminders
  add column if not exists due_date date;

alter table public.reminders
  add column if not exists amount_paid numeric(12,2) not null default 0
  check (amount_paid >= 0);

-- Promise tracking: lightweight commitment log on the record
alter table public.reminders
  add column if not exists promised_date date;

alter table public.reminders
  add column if not exists promise_notes text;

-- Workflow pipeline status
-- Values: 'outstanding' | 'promised' | 'partial' | 'paid' | 'overdue' | 'written_off'
alter table public.reminders
  add column if not exists workflow_status text not null default 'outstanding';

-- Relationship tag for quick segmentation
-- Values: 'new_client' | 'returning' | 'at_risk' | 'vip'
alter table public.reminders
  add column if not exists relationship_tag text;

-- Internal notes (not sent to customer)
alter table public.reminders
  add column if not exists internal_notes text;

-- Index on workflow_status for pipeline queries
create index if not exists reminders_workflow_status_idx
  on public.reminders(user_id, workflow_status)
  where unsubscribed = false;
