-- Drop the old views that were running without security_invoker (bypassing RLS)
DROP VIEW IF EXISTS customer_balances;
DROP VIEW IF EXISTS invoice_balances;

-- Recreate with security_invoker = true so that the calling user's RLS policies apply
-- This means auth.uid() context is preserved and org-scoped RLS on clients/invoices fires correctly

CREATE OR REPLACE VIEW customer_balances
WITH (security_invoker = true)
AS
WITH client_payments AS (
    SELECT 
        i.client_id,
        i.organization_id,
        COALESCE(SUM(p.amount), 0) as total_paid
    FROM invoices i
    LEFT JOIN payments p ON p.invoice_id = i.id
    GROUP BY i.client_id, i.organization_id
),
client_unpaid_invoices AS (
    SELECT 
        i.client_id,
        i.organization_id,
        i.currency,
        SUM(
            GREATEST(0, i.amount - COALESCE((
                SELECT SUM(amount) FROM payments p2 WHERE p2.invoice_id = i.id
            ), 0))
        ) as total_owed
    FROM invoices i
    WHERE i.status NOT IN ('paid', 'written_off')
    GROUP BY i.client_id, i.organization_id, i.currency
)
SELECT 
    c.id,
    c.organization_id,
    c.name,
    c.email,
    c.company_name,
    c.created_at,
    COALESCE(cui.currency, 'USD') as currency,
    COALESCE(cui.total_owed, 0) as total_owed,
    COALESCE(cp.total_paid, 0) as total_paid
FROM clients c
LEFT JOIN client_payments cp ON cp.client_id = c.id AND cp.organization_id = c.organization_id
LEFT JOIN client_unpaid_invoices cui ON cui.client_id = c.id AND cui.organization_id = c.organization_id;

GRANT SELECT ON customer_balances TO authenticated;
GRANT SELECT ON customer_balances TO service_role;

-- Recreate invoice_balances with security_invoker too
CREATE OR REPLACE VIEW invoice_balances
WITH (security_invoker = true)
AS
SELECT 
  i.id,
  i.organization_id,
  i.client_id as customer_id,
  i.amount as amount_owed,
  COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0) as amount_paid,
  COALESCE((SELECT SUM(amount) FROM applied_late_fees WHERE invoice_id = i.id), 0) as late_fees_amount,
  i.currency,
  i.due_date,
  i.status as workflow_status,
  i.created_at,
  i.updated_at,
  i.next_send_at,
  i.invoice_number,
  c.name as recipient_name,
  c.email as recipient_email
FROM invoices i
LEFT JOIN clients c ON c.id = i.client_id;

GRANT SELECT ON invoice_balances TO authenticated;
GRANT SELECT ON invoice_balances TO service_role;
