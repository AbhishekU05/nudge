-- Fix mcp_get_action_center: invoice_count and consecutive_missed_actions are
-- declared integer, but the view supplies them from COUNT() (bigint), so calling
-- the function raised "structure of query does not match function result type"
-- (SQLSTATE 42804). Cast the count columns to integer (per-org/-client counts are
-- tiny). The RETURNS TABLE signature is unchanged, so CREATE OR REPLACE is valid
-- and preserves ownership + grants.

-- Ensure the migration role can replace the mcp_readonly-owned function.
DO $$
BEGIN
  EXECUTE format('GRANT mcp_readonly TO %I', current_user);
EXCEPTION WHEN OTHERS THEN
  NULL;
END
$$;

CREATE OR REPLACE FUNCTION mcp_get_action_center(p_org uuid)
RETURNS TABLE (
  client_name text, recommended_action text, priority text, amount_at_stake numeric,
  days_overdue integer, invoice_count integer, client_risk_score numeric,
  consecutive_missed_actions integer, avg_days_from_due numeric, on_time_rate numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE has_policy boolean;
BEGIN
  PERFORM set_config('app.current_org', p_org::text, true);
  SELECT EXISTS (SELECT 1 FROM late_fee_policies WHERE active) INTO has_policy;
  RETURN QUERY
  SELECT
    s.client_name,
    CASE
      WHEN s.oldest_overdue_days > 30 THEN 'escalate'
      WHEN has_policy AND s.oldest_overdue_days >= 14
        AND NOT EXISTS (
          SELECT 1 FROM applied_late_fees alf JOIN invoices i2 ON i2.id = alf.invoice_id
          WHERE i2.client_id = s.client_id AND alf.applied_at >= CURRENT_DATE - 21
        ) THEN 'apply_late_fee'
      WHEN s.oldest_overdue_days >= 1 THEN 'send_reminder'
      ELSE 'follow_up'
    END,
    CASE
      WHEN s.risk_score >= 7 OR s.oldest_overdue_days > 30 THEN 'high'
      WHEN s.risk_score >= 4 OR s.oldest_overdue_days >= 15 THEN 'medium'
      ELSE 'low'
    END,
    s.total_outstanding,
    s.oldest_overdue_days::integer,
    s.invoices_overdue::integer,
    s.risk_score,
    s.followup_count::integer,
    s.avg_days_from_due,
    s.on_time_rate
  FROM mcp_client_signals s
  WHERE s.total_outstanding > 0
    AND (s.invoices_overdue > 0 OR (s.next_due_date IS NOT NULL AND s.next_due_date <= CURRENT_DATE + 7))
    AND (
      s.last_followup_at IS NULL
      OR (CURRENT_DATE - s.last_followup_at::date) >=
         CASE WHEN s.oldest_overdue_days >= 31 THEN 1 WHEN s.oldest_overdue_days >= 11 THEN 3 ELSE 5 END
    )
  ORDER BY
    CASE WHEN s.risk_score >= 7 OR s.oldest_overdue_days > 30 THEN 0
         WHEN s.risk_score >= 4 OR s.oldest_overdue_days >= 15 THEN 1 ELSE 2 END,
    s.total_outstanding DESC;
END;
$$;

-- Re-assert ownership + grants (no-op if unchanged; CREATE OR REPLACE preserves
-- them, but keep this self-contained).
REVOKE ALL ON FUNCTION mcp_get_action_center(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mcp_get_action_center(uuid) TO service_role;
ALTER FUNCTION mcp_get_action_center(uuid) OWNER TO mcp_readonly;
