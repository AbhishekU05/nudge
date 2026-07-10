CREATE OR REPLACE FUNCTION get_collection_trend(
  p_org_id UUID,
  p_currency TEXT DEFAULT 'USD'
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH monthly_payments AS (
    SELECT 
      date_trunc('month', payment_date) as month_start,
      SUM(amount) as total_amount
    FROM payments
    WHERE 
      (currency = p_currency OR currency IS NULL)
      AND payment_date >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
    GROUP BY date_trunc('month', payment_date)
  )
  SELECT json_agg(
    json_build_object(
      'month', month_start,
      'amount', total_amount
    )
  ) INTO result FROM monthly_payments;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_collection_trend TO authenticated;
GRANT EXECUTE ON FUNCTION get_collection_trend TO service_role;
