-- Enable the pg_net extension to make asynchronous HTTP requests
create extension if not exists "pg_net";

-- NOTE: this function originally embedded the webhook bearer token as a literal
-- here. That token was published by this (public) repository and is compromised;
-- it has been removed from this file and the function is superseded by
-- 20260713010000_webhook_secret_from_setting.sql, which reads the secret from the
-- app.settings.webhook_secret database setting instead. Removing it here does not
-- remove it from git history - rotating the token is what makes it harmless.
create or replace function public.handle_new_invoice_webhook()
returns trigger as $$
declare
  webhook_url text := 'https://duely.in/api/webhooks/supabase';
  webhook_secret text := current_setting('app.settings.webhook_secret', true);
  payload jsonb;
begin
  if webhook_secret is null or webhook_secret = '' then
    raise warning 'app.settings.webhook_secret is not configured; skipping invoice webhook';
    return NEW;
  end if;

  payload := json_build_object(
    'type', 'INSERT',
    'table', 'invoices',
    'record', row_to_json(NEW)
  );

  -- Send asynchronous POST request so we don't block the database insert
  perform net.http_post(
      url := webhook_url,
      headers := jsonb_build_object('Authorization', 'Bearer ' || webhook_secret),
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
