-- 20260710134000_invoice_insert_webhook.sql hardcoded the webhook bearer token
-- directly in this function's Authorization header. Migrations are committed, and
-- this repository is public, so that token was published the moment it was pushed.
-- It must be treated as compromised and rotated.
--
-- The secret is now read from a database setting instead of being written into a
-- migration. The value is set out-of-band (see below) and never enters git.
--
-- REQUIRED, run once in the Supabase SQL editor with the NEW rotated token,
-- substituting your own value:
--
--   ALTER DATABASE postgres SET app.settings.webhook_secret = '<new-token>';
--
-- The same value goes into SUPABASE_WEBHOOK_SECRET in Vercel. Existing sessions
-- keep the old setting until they reconnect, so allow a moment before testing.
--
-- If the setting is absent, current_setting(..., true) returns NULL and no request
-- is sent at all. That is deliberate: it fails closed (no webhook) rather than
-- firing an unauthenticated request that the endpoint would have to reject.

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

  -- Asynchronous POST so the insert is not blocked.
  perform net.http_post(
      url := webhook_url,
      headers := jsonb_build_object('Authorization', 'Bearer ' || webhook_secret),
      body := payload
  );

  return NEW;
end;
$$ language plpgsql security definer;
