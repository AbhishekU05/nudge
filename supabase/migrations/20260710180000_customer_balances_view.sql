CREATE OR REPLACE VIEW customer_balances AS
WITH client_payments AS (
    SELECT 
        i.client_id,
        COALESCE(SUM(p.amount), 0) as total_paid
    FROM invoices i
    LEFT JOIN payments p ON p.invoice_id = i.id
    GROUP BY i.client_id
),
client_unpaid_invoices AS (
    SELECT 
        i.client_id,
        i.currency,
        SUM(
            GREATEST(0, i.amount - COALESCE((
                SELECT SUM(amount) FROM payments p2 WHERE p2.invoice_id = i.id
            ), 0))
        ) as total_owed
    FROM invoices i
    WHERE i.status NOT IN ('paid', 'written_off')
    GROUP BY i.client_id, i.currency
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
LEFT JOIN client_payments cp ON cp.client_id = c.id
LEFT JOIN client_unpaid_invoices cui ON cui.client_id = c.id;

-- Grant permissions
GRANT SELECT ON customer_balances TO authenticated;
GRANT SELECT ON customer_balances TO service_role;
