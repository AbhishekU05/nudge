-- The weekly digest had exactly one chance to fire per week: an hourly cron
-- looked for "it is currently hour 8 on Monday" in each org's timezone. If that
-- single tick was delayed, throttled or failed (deploy, Inngest incident, cold
-- start), the org silently lost the digest for the whole week. Nothing recorded
-- that a digest had been sent, so a replayed run could also send it twice.
--
-- Recording the last send makes the job idempotent (a replay is a no-op) and
-- self-healing (a missed tick is picked up by the next hourly run, instead of
-- losing the week).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMPTZ;
