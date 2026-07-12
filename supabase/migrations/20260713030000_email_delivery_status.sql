-- The Automate tab's Sent box showed every row with status 'sent' as simply
-- "sent", which is what Resend reports at hand-off. A bounce or a spam complaint
-- only arrives hours later, over a webhook, and nothing recorded it against the
-- email: the webhook paused the automation and emailed the user, but the Sent box
-- kept claiming the message was fine.
--
-- Two things were missing:
--   - resend_email_id: the webhook had no way to correlate an event back to a
--     row. Matching on recipient address alone is ambiguous the moment a client
--     is emailed twice.
--   - delivery_status: distinct from `status`, which tracks the *draft*
--     lifecycle (draft -> sent/discarded). Delivery is a separate axis: a row can
--     be status='sent' and delivery_status='bounced'.
--
-- delivery_status values: sent | delivered | delivery_delayed | bounced |
-- complained | failed. NULL means untracked - Gmail-sent mail gets no Resend
-- webhooks, so it stays NULL rather than falsely claiming delivery.
alter table email_drafts
  add column if not exists resend_email_id text,
  add column if not exists delivery_status text,
  add column if not exists delivery_status_at timestamptz,
  add column if not exists delivery_detail text;

-- The webhook looks rows up by this on every delivery event.
create index if not exists email_drafts_resend_email_id_idx
  on email_drafts (resend_email_id)
  where resend_email_id is not null;
