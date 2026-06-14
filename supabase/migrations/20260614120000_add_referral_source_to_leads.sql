-- Add referral_source to leads
alter table public.leads
  add column if not exists referral_source text;
