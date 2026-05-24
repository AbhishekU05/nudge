-- Add QuickBooks data sync integration support.

alter table public.customers
  add column if not exists quickbooks_invoice_id text;

create unique index if not exists customers_user_quickbooks_invoice_id_idx
  on public.customers(user_id, quickbooks_invoice_id);

alter table public.integrations drop constraint if exists integrations_provider_check;
alter table public.integrations add constraint integrations_provider_check check (provider in ('xero', 'quickbooks'));

alter table public.integrations add column if not exists realm_id text;
alter table public.integrations alter column tenant_id drop not null;
