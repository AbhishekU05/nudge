-- Dashboard pipeline RPC
-- Returns the top 10 invoices per bucket for the pipeline widget,
-- aggregate totals (collected, outstanding, overdue), the top 5
-- action-needed clients, and recent events — all in one round-trip.

CREATE OR REPLACE FUNCTION get_dashboard_pipeline(
  p_currency TEXT DEFAULT 'USD'
) RETURNS JSON AS $$
DECLARE
  result JSON;
  v_org_id UUID;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RETURN '{}'::json;
  END IF;

  WITH base AS (
    SELECT
      i.id,
      i.client_id       AS customer_id,
      i.amount          AS amount_owed,
      COALESCE((SELECT SUM(amount) FROM payments            WHERE invoice_id = i.id), 0) AS amount_paid,
      COALESCE((SELECT SUM(amount) FROM applied_late_fees   WHERE invoice_id = i.id), 0) AS late_fees_amount,
      i.currency,
      i.due_date,
      i.promised_date,
      i.status          AS workflow_status,
      i.created_at,
      i.invoice_number,
      i.client_paid_at,
      c.name            AS recipient_name,
      c.email           AS recipient_email,
      CASE
        WHEN (i.status IN ('paid','written_off') OR
              COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0) >= i.amount)
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
    WHERE i.organization_id = v_org_id
      AND (i.currency = p_currency OR p_currency IS NULL)
  ),
  totals AS (
    SELECT
      COALESCE(SUM(amount_paid), 0)                                                     AS total_collected,
      COALESCE(SUM(GREATEST(0, amount_owed - amount_paid))
        FILTER (WHERE bucket IN ('overdue','outstanding') AND workflow_status != 'written_off'), 0) AS total_outstanding,
      COALESCE(SUM(GREATEST(0, amount_owed - amount_paid))
        FILTER (WHERE bucket = 'overdue'), 0)                                            AS total_overdue,
      COUNT(*) FILTER (WHERE bucket = 'overdue')                                        AS overdue_count,
      COUNT(*) FILTER (WHERE bucket = 'outstanding')                                    AS outstanding_count,
      COUNT(*) FILTER (WHERE bucket = 'paid')                                           AS paid_count
    FROM base
  ),
  action_needed AS (
    SELECT
      customer_id AS id,
      recipient_name AS name,
      SUM(GREATEST(0, amount_owed - amount_paid)) AS remaining,
      MAX(days_overdue) AS days_overdue,
      currency
    FROM base
    WHERE bucket = 'overdue'
    GROUP BY customer_id, recipient_name, currency
    ORDER BY days_overdue DESC, remaining DESC
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
  recent_events AS (
    SELECT
      e.id,
      e.invoice_id,
      e.event_type,
      e.created_at,
      e.description AS note,
      c.name AS client_name
    FROM events e
    LEFT JOIN invoices i ON i.id = e.invoice_id
    LEFT JOIN clients c ON c.id = i.client_id
    WHERE i.organization_id = v_org_id
    ORDER BY e.created_at DESC
    LIMIT 5
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
    'actionNeeded',   COALESCE((SELECT json_agg(row_to_json(action_needed.*)) FROM action_needed), '[]'::json),
    'recentEvents',   COALESCE((SELECT json_agg(row_to_json(recent_events.*)) FROM recent_events),  '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_dashboard_pipeline(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_pipeline(TEXT) TO service_role;
