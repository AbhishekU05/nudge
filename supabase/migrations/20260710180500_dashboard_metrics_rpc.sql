CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_org_id UUID,
  p_currency TEXT DEFAULT 'USD'
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH invoice_payments AS (
    SELECT 
      i.id as invoice_id,
      i.amount as amount_owed,
      COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0) as amount_paid,
      i.status as invoice_status,
      i.due_date,
      i.client_id
    FROM invoices i
    WHERE i.organization_id = p_org_id AND (i.currency = p_currency OR i.currency IS NULL)
  ),
  aggregated AS (
    SELECT
      COALESCE(SUM(amount_paid), 0) as total_collected,
      COALESCE(SUM(GREATEST(0, amount_owed - amount_paid)), 0) as total_outstanding,
      COALESCE(SUM(
        CASE 
          WHEN (due_date < CURRENT_DATE) AND (invoice_status NOT IN ('paid', 'written_off')) THEN GREATEST(0, amount_owed - amount_paid)
          ELSE 0 
        END
      ), 0) as total_overdue
    FROM invoice_payments
  )
  SELECT row_to_json(aggregated) INTO result FROM aggregated;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_dashboard_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics TO service_role;
