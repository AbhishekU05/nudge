-- Collections maturity assessment leads table
create table if not exists public.collections_maturity_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  overall_score integer not null,
  level text not null,
  follow_up_discipline_score integer not null,
  promise_tracking_score integer not null,
  visibility_score integer not null,
  automation_score integer not null,
  weakest_category text not null,
  strongest_category text not null,
  recommendations jsonb not null,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

alter table public.collections_maturity_leads enable row level security;
