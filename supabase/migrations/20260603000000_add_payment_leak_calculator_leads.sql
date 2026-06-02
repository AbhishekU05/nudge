create table if not exists public.payment_leak_calculator_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  active_clients integer not null,
  average_invoice_value numeric not null,
  late_payment_percentage numeric not null,
  payment_delay_days numeric not null,
  monthly_operating_expenses numeric,
  cash_tied_up numeric not null,
  annual_impact numeric not null,
  risk_score integer not null,
  risk_level text not null,
  late_payment_score numeric not null,
  delay_days_score numeric not null,
  client_concentration_score numeric not null,
  operating_expense_coverage numeric,
  recommendations jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.payment_leak_calculator_leads enable row level security;
