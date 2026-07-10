-- Drop old version if it exists with the old signature
DROP FUNCTION IF EXISTS get_collection_analytics(UUID, TEXT);

-- Main analytics RPC — uses RLS context (auth.uid()) to scope data
CREATE OR REPLACE FUNCTION get_collection_analytics(
  p_currency TEXT DEFAULT 'USD'
) RETURNS JSON AS $$
DECLARE
  result JSON;
  v_org_id UUID;
BEGIN
  -- Resolve org for the calling user
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RETURN '{}'::json;
  END IF;

  WITH inv_balances AS (
    SELECT 
      i.id,
      i.client_id,
      i.amount as amount_owed,
      COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0) as amount_paid,
      i.status,
      i.due_date,
      i.created_at,
      CASE 
        WHEN i.due_date IS NOT NULL AND i.due_date::date < CURRENT_DATE 
             AND i.status NOT IN ('paid', 'written_off')
        THEN EXTRACT(DAY FROM CURRENT_TIMESTAMP - i.due_date::timestamp)
        ELSE 0
      END as days_overdue,
      CASE
        WHEN i.due_date IS NOT NULL AND i.due_date::date >= CURRENT_DATE
        THEN EXTRACT(DAY FROM i.due_date::timestamp - CURRENT_TIMESTAMP)
        ELSE NULL
      END as days_to_due,
      c.name as client_name
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    WHERE i.organization_id = v_org_id 
      AND (i.currency = p_currency OR p_currency IS NULL OR p_currency = 'ALL')
  ),
  basic_stats AS (
    SELECT
      COALESCE(SUM(amount_paid), 0) as total_collected,
      COALESCE(SUM(GREATEST(0, amount_owed - amount_paid)), 0) as total_outstanding,
      COALESCE(SUM(CASE WHEN days_overdue > 0 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) as total_overdue,
      COUNT(CASE WHEN days_overdue > 0 THEN 1 END) as overdue_count,
      COUNT(CASE WHEN status IN ('paid', 'written_off') OR amount_paid >= amount_owed THEN 1 END) as paid_count,
      COUNT(CASE WHEN status NOT IN ('paid', 'written_off') AND amount_paid < amount_owed AND days_overdue = 0 THEN 1 END) as outstanding_count,
      COALESCE(SUM(CASE WHEN days_overdue > 0 THEN days_overdue ELSE 0 END), 0) as total_days_overdue,
      COUNT(*) as total_invoices,
      -- This month counts
      COUNT(CASE WHEN date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE) 
                      AND (status IN ('paid', 'written_off') OR amount_paid >= amount_owed) THEN 1 END) as this_month_paid_count,
      COUNT(CASE WHEN date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
                      AND status NOT IN ('paid', 'written_off') AND amount_paid < amount_owed AND days_overdue = 0 THEN 1 END) as this_month_outstanding_count,
      COUNT(CASE WHEN date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
                      AND days_overdue > 0 THEN 1 END) as this_month_overdue_count
    FROM inv_balances
  ),
  top_offenders AS (
    SELECT 
      client_name as name,
      COALESCE(SUM(GREATEST(0, amount_owed - amount_paid)), 0) as amount,
      MAX(days_overdue) as days
    FROM inv_balances
    WHERE days_overdue > 0
    GROUP BY client_name
    ORDER BY amount DESC
    LIMIT 5
  ),
  aging_buckets AS (
    SELECT
      COALESCE(SUM(CASE WHEN days_overdue BETWEEN 1 AND 30 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) as bucket_1_30,
      COALESCE(SUM(CASE WHEN days_overdue BETWEEN 31 AND 60 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) as bucket_31_60,
      COALESCE(SUM(CASE WHEN days_overdue BETWEEN 61 AND 90 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) as bucket_61_90,
      COALESCE(SUM(CASE WHEN days_overdue > 90 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) as bucket_90_plus
    FROM inv_balances
    WHERE status NOT IN ('paid', 'written_off')
  ),
  forecast_buckets AS (
    SELECT
      COALESCE(SUM(CASE WHEN days_to_due BETWEEN 0 AND 30 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) as bucket_0_30,
      COALESCE(SUM(CASE WHEN days_to_due BETWEEN 31 AND 60 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) as bucket_31_60,
      COALESCE(SUM(CASE WHEN days_to_due BETWEEN 61 AND 90 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) as bucket_61_90
    FROM inv_balances
    WHERE status NOT IN ('paid', 'written_off') AND days_to_due IS NOT NULL
  ),
  revenue_stats AS (
    SELECT
      COALESCE(SUM(CASE WHEN date_trunc('month', p.payment_date) = date_trunc('month', CURRENT_DATE) THEN p.amount ELSE 0 END), 0) as revenue_this_month,
      COALESCE(SUM(CASE WHEN date_trunc('month', p.payment_date) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month') THEN p.amount ELSE 0 END), 0) as revenue_last_month
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    WHERE i.organization_id = v_org_id 
      AND (p.currency = p_currency OR p_currency IS NULL OR p_currency = 'ALL')
  ),
  monthly_collections AS (
    SELECT 
      to_char(date_trunc('month', p.payment_date), 'Mon YYYY') as month,
      date_trunc('month', p.payment_date) as month_start,
      COALESCE(SUM(p.amount), 0) as amount
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    WHERE i.organization_id = v_org_id 
      AND (p.currency = p_currency OR p_currency IS NULL OR p_currency = 'ALL')
      AND p.payment_date >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
    GROUP BY date_trunc('month', p.payment_date), to_char(date_trunc('month', p.payment_date), 'Mon YYYY')
    ORDER BY month_start
  ),
  monthly_followups AS (
    SELECT
      to_char(date_trunc('month', e.created_at), 'Mon YYYY') as month,
      date_trunc('month', e.created_at) as month_start,
      COUNT(*) as count
    FROM events e
    JOIN invoices i ON i.id = e.invoice_id
    WHERE i.organization_id = v_org_id
      AND e.event_type = 'followup'
      AND e.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
    GROUP BY date_trunc('month', e.created_at), to_char(date_trunc('month', e.created_at), 'Mon YYYY')
    ORDER BY month_start
  )
  SELECT json_build_object(
    'stats', (SELECT row_to_json(basic_stats.*) FROM basic_stats),
    'topOffenders', (SELECT COALESCE(json_agg(top_offenders.*), '[]'::json) FROM top_offenders),
    'agingBuckets', (SELECT row_to_json(aging_buckets.*) FROM aging_buckets),
    'forecastBuckets', (SELECT row_to_json(forecast_buckets.*) FROM forecast_buckets),
    'revenue', (SELECT row_to_json(revenue_stats.*) FROM revenue_stats),
    'monthlyCollections', (SELECT COALESCE(json_agg(monthly_collections.*), '[]'::json) FROM monthly_collections),
    'monthlyFollowups', (SELECT COALESCE(json_agg(monthly_followups.*), '[]'::json) FROM monthly_followups)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_collection_analytics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_collection_analytics(TEXT) TO service_role;
