-- Finding 1: applied_late_fees had no idempotency guard. The update-database
-- step in process-late-fee.ts inserted the fee row in a non-atomic, retriable
-- step, so a retry after that insert committed could record the same late fee
-- twice, inflating invoice_balances.late_fees_amount (SUM of applied fees) and
-- every balance derived from it.

BEGIN;

-- 1. Collapse historical duplicates. Recurring policies legitimately apply
--    many times, but never twice for the same (invoice, policy, amount) on the
--    same calendar day (weekly/monthly fees are >= 7 days apart), so same-day
--    repeats are retry artifacts. Keep the earliest row in each group.
DELETE FROM applied_late_fees
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY invoice_id, policy_id, amount, date_trunc('day', applied_at)
             ORDER BY applied_at ASC, id ASC
           ) AS rn
    FROM applied_late_fees
  ) ranked
  WHERE ranked.rn > 1
);

-- 2. Per-application idempotency key, written from the Inngest event id going
--    forward. Partial index so pre-existing rows (NULL key) stay exempt while
--    every new application is enforced unique.
ALTER TABLE applied_late_fees ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS applied_late_fees_idempotency_key_unique
  ON applied_late_fees (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMIT;
