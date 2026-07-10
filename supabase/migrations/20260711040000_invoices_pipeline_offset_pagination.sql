-- get_invoices_pipeline hard-capped every bucket at p_bucket_limit (30) with
-- no way to reach anything past it — a bucket with 80 overdue invoices only
-- ever exposed the top 30; the other 50 were unreachable from /invoices.
-- The client's "Load more" button was slicing an array that only ever had
-- 30 items in it, so it never actually revealed anything new.
--
-- Adds a per-bucket OFFSET so each of the three columns (overdue/outstanding
-- /paid) can be paginated independently — the page you're viewing of
-- "Overdue" doesn't reset "Paid" back to page 1, etc.
--
-- Must DROP first: adding parameters changes the function's argument type
-- signature, so CREATE OR REPLACE would otherwise create a second
-- overloaded function instead of replacing the old 3-arg one.
DROP FUNCTION IF EXISTS get_invoices_pipeline(TEXT, UUID, INT);

CREATE OR REPLACE FUNCTION get_invoices_pipeline(
  p_currency TEXT DEFAULT 'USD',
  p_group_id UUID DEFAULT NULL,
  p_bucket_limit INT DEFAULT 30,
  p_overdue_offset INT DEFAULT 0,
  p_outstanding_offset INT DEFAULT 0,
  p_paid_offset INT DEFAULT 0
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
    LIMIT p_bucket_limit OFFSET p_overdue_offset
  ),
  outstanding_rows AS (
    SELECT *
    FROM base
    WHERE bucket = 'outstanding'
    ORDER BY due_date ASC NULLS LAST, created_at DESC
    LIMIT p_bucket_limit OFFSET p_outstanding_offset
  ),
  paid_rows AS (
    SELECT *
    FROM base
    WHERE bucket = 'paid'
    ORDER BY created_at DESC
    LIMIT p_bucket_limit OFFSET p_paid_offset
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

GRANT EXECUTE ON FUNCTION get_invoices_pipeline(TEXT, UUID, INT, INT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoices_pipeline(TEXT, UUID, INT, INT, INT, INT) TO service_role;
