-- Restore tenant correctness after the server-side aggregation refactor.
--
-- 1. Drop objects that are unused by the app and unsafe to leave callable:
--    - get_dashboard_metrics: SECURITY DEFINER taking the org id as a client
--      parameter — any authenticated user could read any org's aggregates.
--    - get_collection_trend: SECURITY DEFINER with no org filter at all.
--    - customer_balances / invoice_balances: no longer referenced by the app.
-- 2. Recreate the three RPCs the app uses as SECURITY INVOKER so the caller's
--    RLS policies scope every table they touch (same trust model as the rest
--    of the app), and fix their business logic:
--    - NULL invoice currency is treated as USD instead of being excluded.
--    - payment aggregates are scoped by the *invoice's* currency consistently.
--    - references to invoices.promised_date / invoices.client_paid_at are
--      removed: those columns do not exist in the database (they only ever
--      existed in the TS types), so the previous RPC bodies errored at runtime.
-- 3. Add get_invoice_currencies() so pages can build the currency selector
--    without downloading one row per invoice.
-- 4. Add the activity_feed view (security_invoker) so the activity page can
--    paginate one ordered source instead of merging two paginated queries.

DROP FUNCTION IF EXISTS get_dashboard_metrics(UUID, TEXT);
DROP FUNCTION IF EXISTS get_collection_trend(UUID, TEXT);
DROP VIEW IF EXISTS customer_balances;
DROP VIEW IF EXISTS invoice_balances;

-- ---------------------------------------------------------------------------
-- Distinct currencies for the current user's org(s), RLS-scoped
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_invoice_currencies()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT COALESCE(array_agg(DISTINCT COALESCE(currency, 'USD') ORDER BY COALESCE(currency, 'USD')), '{}')
  FROM invoices;
$$;

GRANT EXECUTE ON FUNCTION get_invoice_currencies() TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoice_currencies() TO service_role;

-- ---------------------------------------------------------------------------
-- Analytics
-- ---------------------------------------------------------------------------
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
      to_char(date_trunc('month', p.payment_date), 'Mon YYYY') AS month,
      date_trunc('month', p.payment_date) AS month_start,
      COALESCE(SUM(p.amount), 0) AS amount
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    WHERE (p_currency IS NULL OR p_currency = 'ALL' OR COALESCE(i.currency, 'USD') = p_currency)
      AND p.payment_date >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
    GROUP BY date_trunc('month', p.payment_date), to_char(date_trunc('month', p.payment_date), 'Mon YYYY')
    ORDER BY month_start
  ),
  monthly_followups AS (
    SELECT
      to_char(date_trunc('month', e.created_at), 'Mon YYYY') AS month,
      date_trunc('month', e.created_at) AS month_start,
      COUNT(*) AS count
    FROM events e
    JOIN invoices i ON i.id = e.invoice_id
    WHERE e.event_type = 'followup'
      AND (p_currency IS NULL OR p_currency = 'ALL' OR COALESCE(i.currency, 'USD') = p_currency)
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
$$;

GRANT EXECUTE ON FUNCTION get_collection_analytics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_collection_analytics(TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Invoices pipeline
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_invoices_pipeline(
  p_currency TEXT DEFAULT 'USD',
  p_group_id UUID DEFAULT NULL,
  p_bucket_limit INT DEFAULT 30
) RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH base AS (
    SELECT
      i.id,
      i.organization_id,
      i.client_id       AS customer_id,
      i.amount          AS amount_owed,
      pay.amount_paid,
      fees.late_fees_amount,
      i.currency,
      i.due_date,
      i.status          AS workflow_status,
      i.created_at,
      i.invoice_number,
      c.name            AS recipient_name,
      c.email           AS recipient_email,
      CASE
        WHEN i.status IN ('paid', 'written_off')
             OR pay.amount_paid >= i.amount
          THEN 'paid'
        WHEN i.due_date IS NOT NULL AND i.due_date::date < CURRENT_DATE
          THEN 'overdue'
        ELSE 'outstanding'
      END AS bucket,
      CASE
        WHEN i.due_date IS NOT NULL AND i.due_date::date < CURRENT_DATE
          THEN CURRENT_DATE - i.due_date::date
        ELSE 0
      END AS days_overdue
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(p.amount), 0) AS amount_paid
      FROM payments p WHERE p.invoice_id = i.id
    ) pay ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(f.amount), 0) AS late_fees_amount
      FROM applied_late_fees f WHERE f.invoice_id = i.id
    ) fees ON true
    WHERE (p_currency IS NULL OR COALESCE(i.currency, 'USD') = p_currency)
      AND (
        p_group_id IS NULL
        OR i.client_id IN (
          SELECT customer_id FROM customer_groups WHERE group_id = p_group_id
        )
      )
  ),
  counts AS (
    SELECT
      COUNT(*) FILTER (WHERE bucket = 'overdue')     AS overdue_count,
      COUNT(*) FILTER (WHERE bucket = 'outstanding') AS outstanding_count,
      COUNT(*) FILTER (WHERE bucket = 'paid')        AS paid_count,
      COALESCE(SUM(GREATEST(0, amount_owed - amount_paid))
        FILTER (WHERE bucket IN ('overdue', 'outstanding')), 0
      ) AS total_outstanding_amount
    FROM base
  ),
  overdue_rows AS (
    SELECT *
    FROM base
    WHERE bucket = 'overdue'
    ORDER BY days_overdue DESC, amount_owed DESC
    LIMIT p_bucket_limit
  ),
  outstanding_rows AS (
    SELECT *
    FROM base
    WHERE bucket = 'outstanding'
    ORDER BY due_date ASC NULLS LAST, created_at DESC
    LIMIT p_bucket_limit
  ),
  paid_rows AS (
    SELECT *
    FROM base
    WHERE bucket = 'paid'
    ORDER BY created_at DESC
    LIMIT p_bucket_limit
  )
  SELECT json_build_object(
    'overdue', json_build_object(
      'rows', COALESCE((SELECT json_agg(row_to_json(overdue_rows.*)) FROM overdue_rows), '[]'::json),
      'count', (SELECT overdue_count FROM counts)
    ),
    'outstanding', json_build_object(
      'rows', COALESCE((SELECT json_agg(row_to_json(outstanding_rows.*)) FROM outstanding_rows), '[]'::json),
      'count', (SELECT outstanding_count FROM counts)
    ),
    'paid', json_build_object(
      'rows', COALESCE((SELECT json_agg(row_to_json(paid_rows.*)) FROM paid_rows), '[]'::json),
      'count', (SELECT paid_count FROM counts)
    ),
    'totals', json_build_object(
      'outstandingAmount', (SELECT total_outstanding_amount FROM counts),
      'overdueCount',      (SELECT overdue_count FROM counts),
      'outstandingCount',  (SELECT outstanding_count FROM counts),
      'paidCount',         (SELECT paid_count FROM counts),
      'optedOutCount',     0
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_invoices_pipeline(TEXT, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoices_pipeline(TEXT, UUID, INT) TO service_role;

-- ---------------------------------------------------------------------------
-- Dashboard pipeline
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_pipeline(
  p_currency TEXT DEFAULT 'USD'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH base AS (
    SELECT
      i.id,
      i.client_id       AS customer_id,
      i.amount          AS amount_owed,
      pay.amount_paid,
      fees.late_fees_amount,
      i.currency,
      i.due_date,
      i.status          AS workflow_status,
      i.created_at,
      i.invoice_number,
      c.name            AS recipient_name,
      c.email           AS recipient_email,
      CASE
        WHEN i.status IN ('paid', 'written_off')
             OR pay.amount_paid >= i.amount
          THEN 'paid'
        WHEN i.due_date IS NOT NULL AND i.due_date::date < CURRENT_DATE
          THEN 'overdue'
        ELSE 'outstanding'
      END AS bucket,
      CASE
        WHEN i.due_date IS NOT NULL AND i.due_date::date < CURRENT_DATE
          THEN CURRENT_DATE - i.due_date::date
        ELSE 0
      END AS days_overdue
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(p.amount), 0) AS amount_paid
      FROM payments p WHERE p.invoice_id = i.id
    ) pay ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(f.amount), 0) AS late_fees_amount
      FROM applied_late_fees f WHERE f.invoice_id = i.id
    ) fees ON true
    WHERE (p_currency IS NULL OR COALESCE(i.currency, 'USD') = p_currency)
  ),
  totals AS (
    SELECT
      COALESCE(SUM(amount_paid), 0)                                                      AS total_collected,
      COALESCE(SUM(GREATEST(0, amount_owed - amount_paid))
        FILTER (WHERE bucket IN ('overdue', 'outstanding')), 0)                          AS total_outstanding,
      COALESCE(SUM(GREATEST(0, amount_owed - amount_paid))
        FILTER (WHERE bucket = 'overdue'), 0)                                            AS total_overdue,
      COUNT(*) FILTER (WHERE bucket = 'overdue')                                         AS overdue_count,
      COUNT(*) FILTER (WHERE bucket = 'outstanding')                                     AS outstanding_count,
      COUNT(*) FILTER (WHERE bucket = 'paid')                                            AS paid_count
    FROM base
  ),
  action_needed AS (
    SELECT
      customer_id AS id,
      recipient_name AS name,
      SUM(GREATEST(0, amount_owed - amount_paid)) AS remaining,
      MAX(days_overdue) AS "daysOverdue",
      currency
    FROM base
    WHERE bucket = 'overdue'
    GROUP BY customer_id, recipient_name, currency
    ORDER BY MAX(days_overdue) DESC, SUM(GREATEST(0, amount_owed - amount_paid)) DESC
    LIMIT 5
  ),
  overdue_rows AS (
    SELECT * FROM base WHERE bucket = 'overdue'
    ORDER BY days_overdue DESC LIMIT 10
  ),
  outstanding_rows AS (
    SELECT * FROM base WHERE bucket = 'outstanding'
    ORDER BY due_date ASC NULLS LAST LIMIT 10
  ),
  paid_rows AS (
    SELECT * FROM base WHERE bucket = 'paid'
    ORDER BY created_at DESC LIMIT 10
  ),
  recent_rows AS (
    SELECT * FROM base
    ORDER BY created_at DESC LIMIT 5
  ),
  recent_events AS (
    -- RLS on events scopes this to the caller's org(s); client-level events
    -- (invoice_id IS NULL) are included with the client's name resolved directly.
    SELECT
      e.id,
      e.invoice_id,
      e.event_type,
      e.created_at,
      e.description AS note,
      COALESCE(ci.name, cd.name) AS client_name
    FROM events e
    LEFT JOIN invoices i ON i.id = e.invoice_id
    LEFT JOIN clients ci ON ci.id = i.client_id
    LEFT JOIN clients cd ON cd.id = e.client_id
    ORDER BY e.created_at DESC
    LIMIT 5
  ),
  monthly_collections AS (
    SELECT
      to_char(date_trunc('month', p.payment_date), 'Mon YYYY') AS month,
      date_trunc('month', p.payment_date) AS month_start,
      COALESCE(SUM(p.amount), 0) AS amount
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    WHERE (p_currency IS NULL OR COALESCE(i.currency, 'USD') = p_currency)
      AND p.payment_date >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
    GROUP BY date_trunc('month', p.payment_date), to_char(date_trunc('month', p.payment_date), 'Mon YYYY')
    ORDER BY month_start
  )
  SELECT json_build_object(
    'pipelines', json_build_object(
      'overdue',      json_build_object('rows', COALESCE((SELECT json_agg(row_to_json(overdue_rows.*))      FROM overdue_rows),      '[]'::json), 'count', (SELECT overdue_count      FROM totals)),
      'outstanding',  json_build_object('rows', COALESCE((SELECT json_agg(row_to_json(outstanding_rows.*))  FROM outstanding_rows),  '[]'::json), 'count', (SELECT outstanding_count  FROM totals)),
      'paid',         json_build_object('rows', COALESCE((SELECT json_agg(row_to_json(paid_rows.*))         FROM paid_rows),         '[]'::json), 'count', (SELECT paid_count         FROM totals))
    ),
    'totals', json_build_object(
      'totalCollected',     (SELECT total_collected     FROM totals),
      'totalOutstanding',   (SELECT total_outstanding   FROM totals),
      'totalOverdue',       (SELECT total_overdue       FROM totals),
      'overdueCount',       (SELECT overdue_count       FROM totals),
      'outstandingCount',   (SELECT outstanding_count   FROM totals),
      'paidCount',          (SELECT paid_count          FROM totals),
      'optedOutCount',      0,
      'collectionRate',     CASE WHEN ((SELECT total_collected FROM totals) + (SELECT total_outstanding FROM totals)) > 0
                              THEN ROUND(((SELECT total_collected FROM totals)::numeric / ((SELECT total_collected FROM totals) + (SELECT total_outstanding FROM totals))) * 100, 2)
                              ELSE 0
                            END
    ),
    'actionNeeded',       COALESCE((SELECT json_agg(row_to_json(action_needed.*))       FROM action_needed),       '[]'::json),
    'recentEvents',       COALESCE((SELECT json_agg(row_to_json(recent_events.*))       FROM recent_events),       '[]'::json),
    'recentInvoices',     COALESCE((SELECT json_agg(row_to_json(recent_rows.*))         FROM recent_rows),         '[]'::json),
    'monthlyCollections', COALESCE((SELECT json_agg(row_to_json(monthly_collections.*)) FROM monthly_collections), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_pipeline(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_pipeline(TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Unified activity feed (events + payments) as one ordered, RLS-scoped source
-- so the activity page can paginate correctly with a single range query.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW activity_feed
WITH (security_invoker = true)
AS
SELECT
  e.id::text                     AS id,
  'event'::text                  AS kind,
  e.invoice_id                   AS invoice_id,
  e.client_id                    AS client_id,
  e.event_type::text             AS event_type,
  NULL::numeric                  AS amount,
  NULL::text                     AS currency,
  NULL::text                     AS payment_source,
  e.description                  AS note,
  i.invoice_number               AS invoice_number,
  COALESCE(ci.name, cd.name)     AS client_name,
  e.created_at                   AS event_date,
  e.created_at                   AS created_at
FROM events e
LEFT JOIN invoices i ON i.id = e.invoice_id
LEFT JOIN clients ci ON ci.id = i.client_id
LEFT JOIN clients cd ON cd.id = e.client_id
UNION ALL
SELECT
  p.id::text,
  'payment'::text,
  p.invoice_id,
  i.client_id,
  'payment'::text,
  p.amount::numeric,
  p.currency::text,
  p.payment_method::text,
  NULL::text,
  i.invoice_number,
  ci.name,
  COALESCE(p.payment_date::timestamptz, p.created_at),
  p.created_at
FROM payments p
LEFT JOIN invoices i ON i.id = p.invoice_id
LEFT JOIN clients ci ON ci.id = i.client_id;

GRANT SELECT ON activity_feed TO authenticated;
GRANT SELECT ON activity_feed TO service_role;
