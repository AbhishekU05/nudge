CREATE OR REPLACE VIEW invoice_balances AS
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
