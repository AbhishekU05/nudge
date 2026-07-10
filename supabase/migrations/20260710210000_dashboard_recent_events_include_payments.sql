-- get_dashboard_pipeline's recent_events CTE only selected FROM events, but
-- crm_event_type has no 'payment' value — logged payments live in the
-- separate `payments` table and could never appear in the dashboard's
-- Recent Activity feed. Union payments in so "Payment Logged" entries show
-- up alongside follow-ups etc., ordered together and capped at 5.
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
    -- RLS scopes this to the caller's org(s); unions events with payments so
    -- "Payment Logged" entries (which live in their own table, not the
    -- crm_event_type enum) appear in the feed alongside follow-ups etc.
    -- Client-level events (invoice_id IS NULL) resolve the client's name directly.
    SELECT id, invoice_id, event_type, created_at, note, client_name, amount
    FROM (
      SELECT
        e.id,
        e.invoice_id,
        e.event_type::text AS event_type,
        e.created_at,
        e.description AS note,
        COALESCE(ci.name, cd.name) AS client_name,
        NULL::numeric AS amount
      FROM events e
      LEFT JOIN invoices i ON i.id = e.invoice_id
      LEFT JOIN clients ci ON ci.id = i.client_id
      LEFT JOIN clients cd ON cd.id = e.client_id
      UNION ALL
      SELECT
        p.id,
        p.invoice_id,
        'payment'::text AS event_type,
        p.created_at,
        NULL::text AS note,
        c.name AS client_name,
        p.amount
      FROM payments p
      LEFT JOIN invoices i ON i.id = p.invoice_id
      LEFT JOIN clients c ON c.id = i.client_id
    ) combined
    ORDER BY created_at DESC
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
