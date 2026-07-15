-- Duplicate payment rows accumulated while webhook_events idempotency was
-- broken: every Xero INVOICE redelivery reprocessed in full and re-ran
-- upsertPayment, and nothing at the DB level enforced one row per external
-- payment. See lib/inngest/functions/xero-webhook-event.ts.
--
-- reference_id holds the external gateway payment id (e.g. a Xero paymentID),
-- which uniquely identifies one real-world payment, so collapsing to a single
-- row per (organization_id, reference_id) is safe. Manual payments carry a
-- NULL reference_id and are deliberately left untouched.
--
-- No invoice fix-up is needed: invoices.amount / status are authoritative from
-- Xero, and every "amount due" is derived live as amount - SUM(payments) in
-- invoice_balances / customer_balances, so it self-corrects once the duplicate
-- payment rows are gone.

BEGIN;

-- 1. Remove duplicates, keeping the earliest row in each group.
DELETE FROM payments
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY organization_id, reference_id
             ORDER BY created_at ASC, id ASC
           ) AS rn
    FROM payments
    WHERE reference_id IS NOT NULL
  ) ranked
  WHERE ranked.rn > 1
);

-- 2. Enforce it going forward. Partial index so multiple manual payments
--    (NULL reference_id) remain allowed.
CREATE UNIQUE INDEX IF NOT EXISTS payments_org_reference_id_unique
  ON payments (organization_id, reference_id)
  WHERE reference_id IS NOT NULL;

COMMIT;
