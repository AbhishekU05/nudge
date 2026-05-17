-- Add payment history for customer balances.

create table if not exists public.payment_logs (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references public.reminders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD',
  source text not null default 'user'
    check (source in ('user', 'customer', 'adjustment')),
  created_at timestamptz not null default now()
);

create index if not exists payment_logs_reminder_created_idx
  on public.payment_logs(reminder_id, created_at desc);

create index if not exists payment_logs_user_created_idx
  on public.payment_logs(user_id, created_at desc);

alter table public.payment_logs enable row level security;

drop policy if exists "payment_logs_select_own" on public.payment_logs;
create policy "payment_logs_select_own"
on public.payment_logs
for select
using (auth.uid() = user_id);

drop policy if exists "payment_logs_insert_own" on public.payment_logs;
create policy "payment_logs_insert_own"
on public.payment_logs
for insert
with check (auth.uid() = user_id);
