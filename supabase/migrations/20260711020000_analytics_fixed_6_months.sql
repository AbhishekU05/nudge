-- monthly_collections and monthly_followups both used GROUP BY over actual
-- payment/event rows, so a month with zero activity was simply absent from
-- the returned array (not zero-filled) — the Collection Trends and
-- Follow-up Activity charts only showed however many months actually had
-- data, sometimes as few as 1-3 instead of the intended 6. Same class of bug
-- already fixed for get_dashboard_pipeline's monthlyCollections. Rewritten
-- with generate_series so both always return exactly 6 ordered, zero-filled
-- months regardless of data gaps.
CREATE OR REPLACE FUNCTION get_collection_analytics(
  p_currency TEXT DEFAULT 'USD'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH inv_balances AS (
    SELECT
      i.id,
      i.client_id,
      i.amount AS amount_owed,
      pay.amount_paid,
      i.status,
      i.due_date,
      i.created_at,
      c.name AS client_name,
      (
        i.status IN ('paid', 'written_off')
        OR pay.amount_paid >= i.amount
      ) AS is_paid,
      CASE
        WHEN i.status NOT IN ('paid', 'written_off')
             AND pay.amount_paid < i.amount
             AND i.due_date IS NOT NULL
             AND i.due_date::date < CURRENT_DATE
        THEN CURRENT_DATE - i.due_date::date
        ELSE 0
      END AS days_overdue,
      CASE
        WHEN i.due_date IS NOT NULL AND i.due_date::date >= CURRENT_DATE
        THEN i.due_date::date - CURRENT_DATE
        ELSE NULL
      END AS days_to_due
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(p.amount), 0) AS amount_paid
      FROM payments p WHERE p.invoice_id = i.id
    ) pay ON true
    WHERE (p_currency IS NULL OR p_currency = 'ALL' OR COALESCE(i.currency, 'USD') = p_currency)
  ),
  basic_stats AS (
    SELECT
      COALESCE(SUM(amount_paid), 0) AS total_collected,
      COALESCE(SUM(GREATEST(0, amount_owed - amount_paid)), 0) AS total_outstanding,
      COALESCE(SUM(CASE WHEN days_overdue > 0 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) AS total_overdue,
      COUNT(*) FILTER (WHERE days_overdue > 0) AS overdue_count,
      COUNT(*) FILTER (WHERE is_paid) AS paid_count,
      COUNT(*) FILTER (WHERE NOT is_paid AND days_overdue = 0) AS outstanding_count,
      COALESCE(SUM(days_overdue), 0) AS total_days_overdue,
      COUNT(*) AS total_invoices,
      COUNT(*) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
                         AND is_paid) AS this_month_paid_count,
      COUNT(*) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
                         AND NOT is_paid AND days_overdue = 0) AS this_month_outstanding_count,
      COUNT(*) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
                         AND days_overdue > 0) AS this_month_overdue_count
    FROM inv_balances
  ),
  stats_final AS (
    SELECT
      b.*,
      CASE WHEN (b.total_collected + b.total_outstanding) > 0
        THEN ROUND((b.total_collected::numeric / (b.total_collected + b.total_outstanding)) * 100, 2)
        ELSE 0
      END AS collection_rate,
      CASE WHEN b.overdue_count > 0
        THEN ROUND(b.total_days_overdue::numeric / b.overdue_count)
        ELSE 0
      END AS avg_days_overdue
    FROM basic_stats b
  ),
  top_offenders AS (
    SELECT
      client_name AS name,
      COALESCE(SUM(GREATEST(0, amount_owed - amount_paid)), 0) AS amount,
      MAX(days_overdue) AS days
    FROM inv_balances
    WHERE days_overdue > 0
    GROUP BY client_name
    ORDER BY amount DESC
    LIMIT 5
  ),
  worst_client AS (
    SELECT client_name AS name, MAX(days_overdue) AS days
    FROM inv_balances
    WHERE days_overdue > 0
    GROUP BY client_name
    ORDER BY MAX(days_overdue) DESC
    LIMIT 1
  ),
  aging_buckets AS (
    SELECT
      COALESCE(SUM(CASE WHEN days_overdue BETWEEN 1 AND 30 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) AS bucket_1_30,
      COALESCE(SUM(CASE WHEN days_overdue BETWEEN 31 AND 60 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) AS bucket_31_60,
      COALESCE(SUM(CASE WHEN days_overdue BETWEEN 61 AND 90 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) AS bucket_61_90,
      COALESCE(SUM(CASE WHEN days_overdue > 90 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) AS bucket_90_plus
    FROM inv_balances
  ),
  forecast_buckets AS (
    SELECT
      COALESCE(SUM(CASE WHEN days_to_due BETWEEN 0 AND 30 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) AS bucket_0_30,
      COALESCE(SUM(CASE WHEN days_to_due BETWEEN 31 AND 60 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) AS bucket_31_60,
      COALESCE(SUM(CASE WHEN days_to_due BETWEEN 61 AND 90 THEN GREATEST(0, amount_owed - amount_paid) ELSE 0 END), 0) AS bucket_61_90
    FROM inv_balances
    WHERE NOT is_paid AND days_to_due IS NOT NULL
  ),
  revenue_stats AS (
    SELECT
      COALESCE(SUM(CASE WHEN date_trunc('month', p.payment_date) = date_trunc('month', CURRENT_DATE) THEN p.amount ELSE 0 END), 0) AS revenue_this_month,
      COALESCE(SUM(CASE WHEN date_trunc('month', p.payment_date) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month') THEN p.amount ELSE 0 END), 0) AS revenue_last_month
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    WHERE (p_currency IS NULL OR p_currency = 'ALL' OR COALESCE(i.currency, 'USD') = p_currency)
  ),
  monthly_collections AS (
    SELECT
      to_char(m.month_start, 'Mon YYYY') AS month,
      m.month_start,
      COALESCE(SUM(mp.amount), 0) AS amount
    FROM generate_series(
           date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),
           date_trunc('month', CURRENT_DATE),
           INTERVAL '1 month'
         ) AS m(month_start)
    LEFT JOIN LATERAL (
      SELECT p.amount
      FROM payments p
      JOIN invoices i ON i.id = p.invoice_id
      WHERE date_trunc('month', p.payment_date) = m.month_start
        AND (p_currency IS NULL OR p_currency = 'ALL' OR COALESCE(i.currency, 'USD') = p_currency)
    ) mp ON true
    GROUP BY m.month_start
    ORDER BY m.month_start
  ),
  monthly_followups AS (
    SELECT
      to_char(m.month_start, 'Mon YYYY') AS month,
      m.month_start,
      COUNT(mf.id) AS count
    FROM generate_series(
           date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),
           date_trunc('month', CURRENT_DATE),
           INTERVAL '1 month'
         ) AS m(month_start)
    LEFT JOIN LATERAL (
      SELECT e.id
      FROM events e
      JOIN invoices i ON i.id = e.invoice_id
      WHERE e.event_type = 'followup'
        AND date_trunc('month', e.created_at) = m.month_start
        AND (p_currency IS NULL OR p_currency = 'ALL' OR COALESCE(i.currency, 'USD') = p_currency)
    ) mf ON true
    GROUP BY m.month_start
    ORDER BY m.month_start
  )
  SELECT json_build_object(
    'stats', (SELECT row_to_json(stats_final.*) FROM stats_final),
    'topOffenders', (SELECT COALESCE(json_agg(top_offenders.*), '[]'::json) FROM top_offenders),
    'worstClient', (SELECT row_to_json(worst_client.*) FROM worst_client),
    'agingBuckets', (SELECT row_to_json(aging_buckets.*) FROM aging_buckets),
    'forecastBuckets', (SELECT row_to_json(forecast_buckets.*) FROM forecast_buckets),
    'revenue', (SELECT row_to_json(revenue_stats.*) FROM revenue_stats),
    'monthlyCollections', (SELECT COALESCE(json_agg(monthly_collections.*), '[]'::json) FROM monthly_collections),
    'monthlyFollowups', (SELECT COALESCE(json_agg(monthly_followups.*), '[]'::json) FROM monthly_followups)
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_collection_analytics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_collection_analytics(TEXT) TO service_role;
