-- Per-policy tax treatment for late fees. Controls how the late-fee invoice is
-- taxed when pushed to Xero (maps to the invoice's lineAmountTypes). Defaults to
-- no_tax so the fee is charged exactly as configured -- matching QuickBooks,
-- which already pushes late-fee lines non-taxable (TaxCodeRef "NON").
ALTER TABLE late_fee_policies
  ADD COLUMN IF NOT EXISTS tax_treatment TEXT NOT NULL DEFAULT 'no_tax'
    CHECK (tax_treatment IN ('no_tax', 'exclusive', 'inclusive'));
