-- Prevent duplicate invoice rows from concurrent Xero/QuickBooks syncs.
--
-- lib/xero.ts and lib/quickbooks.ts both do a check-then-insert (select
-- existing rows by external id, insert if not found). With no DB-level
-- constraint, two overlapping sync runs for the same org (e.g. a webhook
-- sync racing a scheduled batch sync) can both see "not found" and both
-- insert a row for the same external invoice, producing two Duely invoices
-- for one real invoice (double reminders, double late fee evaluation).
--
-- Postgres unique constraints treat NULL as distinct from every other NULL,
-- so this does not restrict manually-created invoices or invoices synced
-- from the other provider (which leave the other id column NULL).
--
-- NOTE: if duplicate rows already exist in production from this race, this
-- migration will fail to apply until they are de-duplicated first.
ALTER TABLE invoices
  ADD CONSTRAINT invoices_org_xero_id_unique UNIQUE (organization_id, xero_id);

ALTER TABLE invoices
  ADD CONSTRAINT invoices_org_quickbooks_id_unique UNIQUE (organization_id, quickbooks_id);
