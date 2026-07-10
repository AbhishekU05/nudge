-- Enable the pg_net extension to make asynchronous HTTP requests
create extension if not exists "pg_net";

create or replace function public.handle_new_invoice_webhook()
returns trigger as $$
declare
  -- Replace this with your local ngrok URL during local testing if needed
  webhook_url text := 'https://duely.in/api/webhooks/supabase';
  payload jsonb;
begin
  -- Build a payload mimicking the standard Supabase Database Webhook format
  payload := json_build_object(
    'type', 'INSERT',
    'table', 'invoices',
    'record', row_to_json(NEW)
  );

  -- Send asynchronous POST request so we don't block the database insert
  perform net.http_post(
      url := webhook_url,
      headers := '{"Authorization": "Bearer JvU+Nq2K1wV/hX8YlBwY6D6s5gT4zR8hL3w1qY2+X4="}'::jsonb,
      body := payload
  );

  return NEW;
end;
$$ language plpgsql security definer;

-- Safely drop the trigger if it already exists to avoid errors on re-runs
drop trigger if exists invoice_insert_webhook_trigger on public.invoices;

create trigger invoice_insert_webhook_trigger
  after insert on public.invoices
  for each row execute function public.handle_new_invoice_webhook();
