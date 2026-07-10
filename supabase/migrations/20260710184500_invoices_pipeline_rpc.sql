-- Invoices pipeline RPC
-- Returns pre-grouped buckets (overdue/outstanding/paid) with only the first 30
-- rows per bucket, plus total counts and outstanding amount.
-- Eliminates loading all invoice rows into Node.js memory.

CREATE OR REPLACE FUNCTION get_invoices_pipeline(
  p_currency TEXT DEFAULT 'USD',
  p_group_id UUID DEFAULT NULL,
  p_bucket_limit INT DEFAULT 30
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
    RETURN '{"overdue":{"rows":[],"count":0},"outstanding":{"rows":[],"count":0},"paid":{"rows":[],"count":0},"totals":{"outstandingAmount":0,"overdueCount":0,"outstandingCount":0,"paidCount":0}}'::json;
  END IF;

  WITH base AS (
    SELECT
      i.id,
      i.organization_id,
      i.client_id       AS customer_id,
      i.amount          AS amount_owed,
      COALESCE((SELECT SUM(amount) FROM payments        WHERE invoice_id = i.id), 0) AS amount_paid,
      COALESCE((SELECT SUM(amount) FROM applied_late_fees WHERE invoice_id = i.id), 0) AS late_fees_amount,
      i.currency,
      i.due_date,
      i.promised_date,
      i.status          AS workflow_status,
      i.created_at,
      i.invoice_number,
      i.client_paid_at,
      c.name            AS recipient_name,
      c.email           AS recipient_email,
      -- Bucket classification
      CASE
        WHEN (i.status IN ('paid','written_off') OR
              COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0) >= i.amount)
          THEN 'paid'
        WHEN i.due_date IS NOT NULL AND i.due_date::date < CURRENT_DATE
          THEN 'overdue'
        ELSE 'outstanding'
      END AS bucket,
      -- Days overdue (for sorting overdue bucket)
      CASE
        WHEN i.due_date IS NOT NULL AND i.due_date::date < CURRENT_DATE
          THEN CURRENT_DATE - i.due_date::date
        ELSE 0
      END AS days_overdue
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    WHERE i.organization_id = v_org_id
      AND (i.currency = p_currency OR p_currency IS NULL)
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
        FILTER (WHERE bucket IN ('overdue','outstanding') AND workflow_status != 'written_off'), 0
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_invoices_pipeline(TEXT, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoices_pipeline(TEXT, UUID, INT) TO service_role;
