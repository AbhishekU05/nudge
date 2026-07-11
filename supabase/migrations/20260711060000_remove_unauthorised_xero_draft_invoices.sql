-- One-time cleanup: Duely's Xero sync used to pull in DRAFT/SUBMITTED
-- invoices alongside AUTHORISED/PAID ones (see lib/xero.ts, syncType ==
-- "invoices"). Xero only assigns an InvoiceNumber once an invoice is
-- authorised, so any synced-from-Xero row with no invoice_number is an
-- invoice that was never actually sent to the client - either still a draft,
-- or a draft that was later deleted in Xero entirely (drafts, unlike
-- authorised invoices, can be permanently deleted rather than just voided).
--
-- The sync now excludes DRAFT/SUBMITTED going forward (only fetches
-- AUTHORISED/PAID/VOIDED), so these existing rows are stale leftovers from
-- before that change and won't be recreated.
--
-- Scoped strictly to xero_id IS NOT NULL: manually-created invoices (via
-- app/actions/customers.ts / app/actions/reminders.ts) also never set
-- invoice_number, so without this scope this would delete real,
-- user-created reminders too.
--
-- payments/events/applied_late_fees all reference invoices(id) ON DELETE
-- CASCADE, so any stray rows tied to these (there shouldn't be any, since a
-- draft was never sent to a client) are cleaned up automatically.
DELETE FROM invoices
WHERE xero_id IS NOT NULL
  AND invoice_number IS NULL;
