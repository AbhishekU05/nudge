-- Record the accounting-software invoice that each late fee GENERATED (the
-- separate Xero/QuickBooks invoice for the fee itself). When that invoice later
-- syncs back into `invoices`, the late-fee workflow looks it up here and skips
-- it, so a late fee is never charged on top of a late fee.
--
-- Additive only: two nullable columns. Existing rows stay NULL and are simply
-- treated as "not a known generated late-fee invoice".
ALTER TABLE applied_late_fees
  ADD COLUMN IF NOT EXISTS generated_xero_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS generated_quickbooks_invoice_id TEXT;

-- Partial indexes: the workflow's lookup is keyed on these ids and only ever
-- matches non-NULL values, so index just those.
CREATE INDEX IF NOT EXISTS applied_late_fees_generated_xero_invoice_id_idx
  ON applied_late_fees (generated_xero_invoice_id)
  WHERE generated_xero_invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS applied_late_fees_generated_quickbooks_invoice_id_idx
  ON applied_late_fees (generated_quickbooks_invoice_id)
  WHERE generated_quickbooks_invoice_id IS NOT NULL;
