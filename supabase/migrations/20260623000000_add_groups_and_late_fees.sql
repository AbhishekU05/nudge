-- Part 1: Invoice Groups
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.groups enable row level security;
create policy "groups_select_own" on public.groups for select using (auth.uid() = user_id);
create policy "groups_insert_own" on public.groups for insert with check (auth.uid() = user_id);
create policy "groups_update_own" on public.groups for update using (auth.uid() = user_id);
create policy "groups_delete_own" on public.groups for delete using (auth.uid() = user_id);

-- Customer Groups Junction
create table if not exists public.customer_groups (
  group_id uuid references public.groups(id) on delete cascade not null,
  customer_id uuid references public.clients(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, customer_id)
);

alter table public.customer_groups enable row level security;
create policy "customer_groups_select_own" on public.customer_groups for select 
  using (exists (select 1 from public.groups where id = group_id and user_id = auth.uid()));
create policy "customer_groups_insert_own" on public.customer_groups for insert 
  with check (exists (select 1 from public.groups where id = group_id and user_id = auth.uid()));

alter table public.customer_events drop constraint if exists customer_events_event_type_check;
alter table public.customer_events add constraint customer_events_event_type_check check (event_type in ('payment', 'followup', 'late_fee'));
create policy "customer_groups_delete_own" on public.customer_groups for delete 
  using (exists (select 1 from public.groups where id = group_id and user_id = auth.uid()));


-- Part 2: Late Fees
create table if not exists public.late_fee_policies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  fee_type text not null check (fee_type in ('flat', 'percentage')),
  fee_value numeric(10,2) not null default 0,
  grace_period_days integer not null default 0,
  frequency text not null check (frequency in ('once', 'weekly', 'monthly')),
  apply_to text not null check (apply_to in ('existing_invoice', 'new_invoice')),
  excluded_group_ids uuid[] default array[]::uuid[],
  active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.late_fee_policies enable row level security;
create policy "late_fee_policies_select_own" on public.late_fee_policies for select using (auth.uid() = user_id);
create policy "late_fee_policies_insert_own" on public.late_fee_policies for insert with check (auth.uid() = user_id);
create policy "late_fee_policies_update_own" on public.late_fee_policies for update using (auth.uid() = user_id);
create policy "late_fee_policies_delete_own" on public.late_fee_policies for delete using (auth.uid() = user_id);

create table if not exists public.applied_late_fees (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  policy_id uuid references public.late_fee_policies(id) on delete set null,
  amount numeric(10,2) not null,
  applied_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.applied_late_fees enable row level security;
create policy "applied_late_fees_select_own" on public.applied_late_fees for select 
  using (exists (select 1 from public.invoices where id = invoice_id and user_id = auth.uid()));
create policy "applied_late_fees_insert_own" on public.applied_late_fees for insert 
  with check (exists (select 1 from public.invoices where id = invoice_id and user_id = auth.uid()));
