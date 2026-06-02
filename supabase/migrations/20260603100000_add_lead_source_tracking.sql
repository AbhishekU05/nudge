-- Add lead source / UTM tracking columns to payment_leak_calculator_leads
alter table public.payment_leak_calculator_leads
  add column if not exists source text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;
