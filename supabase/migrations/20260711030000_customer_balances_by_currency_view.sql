-- /customers currently paginates `clients` directly, then side-fetches
-- invoices/payments for just that page and sums totals in Node. That works
-- for today's "sort by name" list, but blocks future search/sort features:
-- you can't sort or filter by total_owed/total_paid before pagination picks
-- the page, if those numbers don't exist until after pagination runs.
--
-- This view precomputes total_owed/total_paid per client so future
-- search/sort/pagination can all be expressed as plain PostgREST query
-- params (.ilike/.order/.range) against it — no bespoke backend code needed
-- per feature added later.
--
-- One row per (client, currency) they actually have invoices in, matching
-- the app-wide currency-dropdown model (get_invoice_currencies +
-- CurrencySelector): a client with invoices in two currencies gets two rows,
-- each with only that currency's totals — selecting a currency elsewhere in
-- the app filters everything to it, and this view is filtered the same way.
-- Clients with no invoices at all still get exactly one row (USD, $0/$0) via
-- the LEFT JOIN, matching today's behavior of showing brand-new customers.
--
-- security_invoker = true so the caller's RLS policies on clients/invoices/
-- payments apply — same trust model as activity_feed and the pipeline RPCs.
CREATE OR REPLACE VIEW customer_balances_by_currency
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.organization_id,
  c.name,
  c.email,
  c.company_name,
  c.created_at,
  COALESCE(inv.currency, 'USD') AS currency,
  COALESCE(SUM(GREATEST(0, inv.amount - pay.amount_paid))
    FILTER (WHERE inv.status NOT IN ('paid', 'written_off')), 0) AS total_owed,
  COALESCE(SUM(pay.amount_paid), 0) AS total_paid
FROM clients c
LEFT JOIN invoices inv ON inv.client_id = c.id
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(p.amount), 0) AS amount_paid
  FROM payments p WHERE p.invoice_id = inv.id
) pay ON true
GROUP BY c.id, c.organization_id, c.name, c.email, c.company_name, c.created_at, COALESCE(inv.currency, 'USD');

GRANT SELECT ON customer_balances_by_currency TO authenticated;
GRANT SELECT ON customer_balances_by_currency TO service_role;
