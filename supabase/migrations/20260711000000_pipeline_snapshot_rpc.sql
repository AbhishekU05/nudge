-- /pipeline was fetching every invoice and every payment in the org
-- unfiltered, then bucketing/sorting/limiting entirely in the browser. This
-- RPC does the bucketing and the "top 10 by displayed value" limit in
-- Postgres, so at most 10 rows per column ever leave the database:
--   - outstanding / overdue columns display the remaining balance, so they're
--     sorted and capped by `remaining` (GREATEST(0, amount - amount_paid)).
--   - the paid column displays the invoice's total amount, so it's sorted
--     and capped by `amount_owed`.
-- Per-bucket count and total (over the WHOLE bucket, not just the top 10)
-- are returned separately so the column header can still show accurate
-- totals while only rendering 10 cards.
CREATE OR REPLACE FUNCTION get_pipeline_snapshot(
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
      GREATEST(0, i.amount - pay.amount_paid) AS remaining,
      i.currency,
      i.due_date,
      i.status          AS workflow_status,
      i.created_at,
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
    WHERE (p_currency IS NULL OR COALESCE(i.currency, 'USD') = p_currency)
  ),
  bucket_totals AS (
    SELECT
      bucket,
      COUNT(*) AS cnt,
      COALESCE(SUM(CASE WHEN bucket = 'paid' THEN amount_owed ELSE remaining END), 0) AS total_amount
    FROM base
    GROUP BY bucket
  ),
  outstanding_rows AS (
    SELECT * FROM base WHERE bucket = 'outstanding'
    ORDER BY remaining DESC LIMIT 10
  ),
  overdue_rows AS (
    SELECT * FROM base WHERE bucket = 'overdue'
    ORDER BY remaining DESC LIMIT 10
  ),
  paid_rows AS (
    SELECT * FROM base WHERE bucket = 'paid'
    ORDER BY amount_owed DESC LIMIT 10
  )
  SELECT json_build_object(
    'outstanding', json_build_object(
      'rows',  COALESCE((SELECT json_agg(row_to_json(outstanding_rows.*)) FROM outstanding_rows), '[]'::json),
      'count', COALESCE((SELECT cnt FROM bucket_totals WHERE bucket = 'outstanding'), 0),
      'total', COALESCE((SELECT total_amount FROM bucket_totals WHERE bucket = 'outstanding'), 0)
    ),
    'overdue', json_build_object(
      'rows',  COALESCE((SELECT json_agg(row_to_json(overdue_rows.*)) FROM overdue_rows), '[]'::json),
      'count', COALESCE((SELECT cnt FROM bucket_totals WHERE bucket = 'overdue'), 0),
      'total', COALESCE((SELECT total_amount FROM bucket_totals WHERE bucket = 'overdue'), 0)
    ),
    'paid', json_build_object(
      'rows',  COALESCE((SELECT json_agg(row_to_json(paid_rows.*)) FROM paid_rows), '[]'::json),
      'count', COALESCE((SELECT cnt FROM bucket_totals WHERE bucket = 'paid'), 0),
      'total', COALESCE((SELECT total_amount FROM bucket_totals WHERE bucket = 'paid'), 0)
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_pipeline_snapshot(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pipeline_snapshot(TEXT) TO service_role;
