-- 20260713010000 moved the webhook bearer token out of the migration and into the
-- app.settings.webhook_secret database setting. That setting turns out to be
-- unsettable on Supabase: populating it needs
--
--   ALTER DATABASE postgres SET app.settings.webhook_secret = '...';
--
-- and the SQL editor role is not superuser, so that command is rejected with
-- "permission denied". The function applied by 20260713010000 therefore always
-- reads NULL, warns, and skips - the invoice webhook is currently not firing at
-- all.
--
-- Supabase Vault is the supported mechanism for secrets a database function needs
-- to read. It is enabled by default and encrypts the value at rest.
--
-- REQUIRED, run once in the Supabase SQL editor with the NEW rotated token:
--
--   select vault.create_secret(
--     '<new-token>',
--     'webhook_secret',
--     'Bearer token for the invoices insert webhook -> /api/webhooks/supabase'
--   );
--
-- To rotate again later, update in place rather than creating a second secret
-- under the same name:
--
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'webhook_secret'),
--     '<newer-token>'
--   );
--
-- The same value goes into SUPABASE_WEBHOOK_SECRET in Vercel.
--
-- If the secret is absent, no request is sent at all. That is deliberate: it fails
-- closed (no webhook) rather than firing an unauthenticated request.

create extension if not exists supabase_vault with schema vault;

create or replace function public.handle_new_invoice_webhook()
returns trigger as $$
declare
  webhook_url text := 'https://duely.in/api/webhooks/supabase';
  webhook_secret text;
  payload jsonb;
begin
  select decrypted_secret
    into webhook_secret
    from vault.decrypted_secrets
   where name = 'webhook_secret'
   limit 1;

  if webhook_secret is null or webhook_secret = '' then
    raise warning 'vault secret "webhook_secret" is not configured; skipping invoice webhook';
    return NEW;
  end if;

  payload := json_build_object(
    'type', 'INSERT',
    'table', 'invoices',
    'record', row_to_json(NEW)
  );

  -- Asynchronous POST so the insert is not blocked.
  perform net.http_post(
      url := webhook_url,
      headers := jsonb_build_object('Authorization', 'Bearer ' || webhook_secret),
      body := payload
  );

  return NEW;
end;
$$ language plpgsql security definer;
