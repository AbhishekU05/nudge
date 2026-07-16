-- Model Context Protocol (MCP) server: OAuth 2.1 token storage, a read-only
-- Postgres role, and the signal engine the MCP tools read. See lib/mcp/* and
-- app/api/mcp/*.

-- ============================================================================
-- OAuth bookkeeping tables. RLS on, no public policies: only the service role
-- (which bypasses RLS) reads/writes these, mirroring webhook_events.
-- ============================================================================

-- Dynamically-registered OAuth clients (RFC 7591). Claude registers itself here.
CREATE TABLE IF NOT EXISTS mcp_oauth_clients (
  client_id TEXT PRIMARY KEY,
  client_name TEXT,
  redirect_uris TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Short-lived PKCE authorization codes, consumed once at the token endpoint.
CREATE TABLE IF NOT EXISTS mcp_auth_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'read',
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Access + refresh tokens. `token` / `refresh_token` store SHA-256 hashes of the
-- opaque bearer strings, never plaintext. Each token maps to its user AND org, so
-- multiple users in one org each hold their own token but resolve to the same data.
CREATE TABLE IF NOT EXISTS mcp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id TEXT,
  refresh_token TEXT UNIQUE,
  scope TEXT NOT NULL DEFAULT 'read',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,          -- access token expiry
  refresh_expires_at TIMESTAMPTZ            -- refresh-token idle expiry (slides forward on use)
);

CREATE INDEX IF NOT EXISTS idx_mcp_tokens_token ON mcp_tokens(token);
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_refresh_token ON mcp_tokens(refresh_token);
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_user ON mcp_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_auth_codes_expires ON mcp_auth_codes(expires_at);

ALTER TABLE mcp_oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Read-only role. There are NO JWTs and no extra secret: the app calls the
-- signal functions below through the existing service role, and each runs as
-- mcp_readonly (SELECT-only grants -> INSERT/UPDATE/DELETE impossible at the
-- database) and pins app.current_org so RLS scopes every row to that one org.
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mcp_readonly') THEN
    CREATE ROLE mcp_readonly NOLOGIN;
  END IF;
END
$$;

-- Give the migration role membership so it can reassign function ownership to
-- mcp_readonly below (no-op if already a member).
DO $$
BEGIN
  EXECUTE format('GRANT mcp_readonly TO %I', current_user);
EXCEPTION WHEN OTHERS THEN
  NULL;
END
$$;

GRANT USAGE ON SCHEMA public TO mcp_readonly;
-- Only the tables the tools actually read; invoice_balances is security_invoker,
-- so reading it re-applies these base-table policies as mcp_readonly.
GRANT SELECT ON invoices, invoice_balances, payments, clients,
                applied_late_fees, late_fee_policies, events TO mcp_readonly;

-- The org the current request is scoped to, pinned by each function via
-- set_config('app.current_org', ...). NULL when unset, so every policy below then
-- matches no rows -- deny by default.
CREATE OR REPLACE FUNCTION mcp_current_org() RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_org', true), '')::uuid;
$$;
GRANT EXECUTE ON FUNCTION mcp_current_org() TO mcp_readonly;

-- Hard cross-tenant isolation at the database level: mcp_readonly can only ever
-- read rows for the token's org, regardless of what the application does.
CREATE POLICY mcp_readonly_select ON invoices FOR SELECT TO mcp_readonly
  USING (organization_id = mcp_current_org());
CREATE POLICY mcp_readonly_select ON payments FOR SELECT TO mcp_readonly
  USING (organization_id = mcp_current_org());
CREATE POLICY mcp_readonly_select ON clients FOR SELECT TO mcp_readonly
  USING (organization_id = mcp_current_org());
CREATE POLICY mcp_readonly_select ON events FOR SELECT TO mcp_readonly
  USING (organization_id = mcp_current_org());
CREATE POLICY mcp_readonly_select ON late_fee_policies FOR SELECT TO mcp_readonly
  USING (organization_id = mcp_current_org());
-- applied_late_fees has no organization_id column; scope it through its invoice
-- (which is itself org-restricted by the policy above).
CREATE POLICY mcp_readonly_select ON applied_late_fees FOR SELECT TO mcp_readonly
  USING (EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = applied_late_fees.invoice_id
      AND i.organization_id = mcp_current_org()
  ));

-- ============================================================================
-- The deterministic per-client signal engine. security_invoker so reads
-- re-apply the mcp_readonly RLS policies (scoped to app.current_org). Every
-- signal here is computed in SQL -- Claude never derives them.
--
-- OMITTED SIGNALS: "promise kept/broken" stats are intentionally absent. Duely
-- has no structured promise tracking (no promised-date/outcome columns; the UI
-- action engine's promise branch references columns that don't exist), so there
-- is no honest way to compute them -- they need a promise-tracking feature
-- first. `avg_days_from_due` measures payment_date - due_date (signed: positive
-- = paid late, negative = early), off the reliable Xero-populated due_date.
-- ============================================================================
CREATE OR REPLACE VIEW mcp_client_signals WITH (security_invoker = true) AS
WITH inv AS (
  SELECT
    i.id,
    i.client_id,
    i.organization_id,
    i.amount,
    i.currency,
    i.due_date,
    i.status,
    COALESCE(pp.amount_paid, 0) AS amount_paid,
    pp.last_payment_date,
    GREATEST(i.amount - COALESCE(pp.amount_paid, 0), 0) AS remaining,
    (i.status IN ('paid', 'written_off') OR COALESCE(pp.amount_paid, 0) >= i.amount) AS is_paid,
    (COALESCE(pp.amount_paid, 0) > 0 AND COALESCE(pp.amount_paid, 0) < i.amount) AS is_partial,
    CASE
      WHEN i.status NOT IN ('paid', 'written_off')
       AND COALESCE(pp.amount_paid, 0) < i.amount
       AND i.due_date IS NOT NULL AND i.due_date < CURRENT_DATE
      THEN CURRENT_DATE - i.due_date ELSE 0
    END AS days_overdue
  FROM invoices i
  LEFT JOIN LATERAL (
    SELECT SUM(p.amount) AS amount_paid, MAX(p.payment_date) AS last_payment_date
    FROM payments p WHERE p.invoice_id = i.id
  ) pp ON true
),
-- Behaviour is measured over settled invoices with a known payment date.
paid AS (
  SELECT
    client_id,
    due_date,
    (last_payment_date - due_date) AS days_late,          -- signed: <=0 means on time / early
    row_number() OVER (PARTITION BY client_id ORDER BY due_date DESC) AS rn
  FROM inv
  WHERE is_paid AND last_payment_date IS NOT NULL AND due_date IS NOT NULL
),
behavior AS (
  SELECT
    client_id,
    COUNT(*) AS paid_count,
    COUNT(*) FILTER (WHERE days_late <= 0) AS on_time_count,
    ROUND(AVG(GREATEST(days_late, 0))::numeric, 1) AS avg_days_late,
    -- signed avg of payment_date - due_date: positive = late, negative = early, 0 = on time
    ROUND(AVG(days_late)::numeric, 1) AS avg_days_from_due,
    -- trailing streak of late payments (0 if the most recent was on time)
    COALESCE(MIN(rn) FILTER (WHERE days_late <= 0) - 1, MAX(rn)) AS consecutive_late_payments,
    AVG(GREATEST(days_late, 0)) FILTER (WHERE rn <= 3) AS recent_late,
    AVG(GREATEST(days_late, 0)) FILTER (WHERE rn > 3) AS older_late
  FROM paid
  GROUP BY client_id
),
followups AS (
  SELECT i.client_id, COUNT(*) AS followup_count, MAX(e.created_at) AS last_followup_at
  FROM events e
  JOIN invoices i ON i.id = e.invoice_id
  WHERE e.event_type = 'followup'
  GROUP BY i.client_id
),
agg AS (
  SELECT
    c.id AS client_id,
    c.name AS client_name,
    c.organization_id,
    COUNT(iv.id) AS invoice_count,
    COUNT(iv.id) FILTER (WHERE iv.days_overdue > 0) AS invoices_overdue,
    COUNT(iv.id) FILTER (WHERE NOT iv.is_paid) AS active_invoice_count,
    COALESCE(SUM(iv.remaining) FILTER (WHERE NOT iv.is_paid), 0) AS total_outstanding,
    COALESCE(SUM(iv.remaining) FILTER (WHERE iv.days_overdue > 0), 0) AS total_overdue,
    COALESCE(MAX(iv.days_overdue), 0) AS oldest_overdue_days,
    COUNT(iv.id) FILTER (WHERE iv.is_partial) AS partial_payment_count,
    MIN(iv.due_date) FILTER (WHERE NOT iv.is_paid AND iv.due_date >= CURRENT_DATE) AS next_due_date
  FROM clients c
  LEFT JOIN inv iv ON iv.client_id = c.id
  GROUP BY c.id, c.name, c.organization_id
),
scored AS (
  SELECT
    a.client_id,
    a.client_name,
    a.organization_id,
    a.invoice_count,
    a.invoices_overdue,
    a.active_invoice_count,
    a.total_outstanding,
    a.total_overdue,
    a.oldest_overdue_days,
    a.partial_payment_count,
    a.next_due_date,
    COALESCE(b.avg_days_from_due, 0) AS avg_days_from_due,
    COALESCE(b.avg_days_late, 0) AS avg_days_late,
    CASE WHEN b.paid_count > 0 THEN ROUND(b.on_time_count::numeric / b.paid_count, 2) END AS on_time_rate,
    COALESCE(b.consecutive_late_payments, 0) AS consecutive_late_payments,
    COALESCE(b.paid_count, 0) AS paid_count,
    COALESCE(f.followup_count, 0) AS followup_count,
    f.last_followup_at,
    CASE
      WHEN COALESCE(b.paid_count, 0) < 4 OR b.older_late IS NULL THEN 'stable'
      WHEN b.recent_late > b.older_late + 3 THEN 'worsening'
      WHEN b.recent_late < b.older_late - 3 THEN 'improving'
      ELSE 'stable'
    END AS trend,
    -- Weighted 1..10 risk score: overdue severity (<=4) + payment unreliability
    -- (<=3) + trailing late streak (<=2) + trend nudge (+1.5 / -1.0). Tune here
    -- and every consumer (AI and, in future, UI) benefits.
    LEAST(10.0, GREATEST(1.0, ROUND((
        LEAST(a.oldest_overdue_days / 9.0, 4.0)
      + (1 - COALESCE(CASE WHEN b.paid_count > 0 THEN b.on_time_count::numeric / b.paid_count END, 1)) * 3.0
      + LEAST(COALESCE(b.consecutive_late_payments, 0) * 0.5, 2.0)
      + CASE
          WHEN COALESCE(b.paid_count, 0) >= 4 AND b.older_late IS NOT NULL AND b.recent_late > b.older_late + 3 THEN 1.5
          WHEN COALESCE(b.paid_count, 0) >= 4 AND b.older_late IS NOT NULL AND b.recent_late < b.older_late - 3 THEN -1.0
          ELSE 0 END
    )::numeric, 1))) AS risk_score
  FROM agg a
  LEFT JOIN behavior b ON b.client_id = a.client_id
  LEFT JOIN followups f ON f.client_id = a.client_id
)
SELECT
  s.*,
  CASE
    WHEN s.on_time_rate IS NULL THEN 'unknown'
    WHEN s.risk_score <= 2 THEN 'excellent'
    WHEN s.risk_score <= 4 THEN 'good'
    WHEN s.risk_score <= 6 THEN 'fair'
    WHEN s.risk_score <= 8 THEN 'poor'
    ELSE 'very_poor'
  END AS payment_reliability
FROM scored s;

GRANT SELECT ON mcp_client_signals TO mcp_readonly;

-- ============================================================================
-- Signal RPCs. Each pins app.current_org (drives RLS on the view + base tables)
-- and returns pre-computed signals only. Ownership/EXECUTE fixed up at the end.
-- ============================================================================

-- 1. Action center — the recommendations Duely surfaces, with the signals behind
-- each (not the reasoning). Mirrors the UI action engine's severity/priority.
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
    s.oldest_overdue_days,
    s.invoices_overdue,
    s.risk_score,
    s.followup_count,
    s.avg_days_from_due,
    s.on_time_rate
  FROM mcp_client_signals s
  WHERE s.total_outstanding > 0
    AND (s.invoices_overdue > 0 OR (s.next_due_date IS NOT NULL AND s.next_due_date <= CURRENT_DATE + 7))
    -- Cooldown: skip clients contacted within the engine's window for their severity.
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

-- 2. Client risk profile — one client's processed signals (jsonb object).
CREATE OR REPLACE FUNCTION mcp_get_client_risk_profile(p_org uuid, p_client_name text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v jsonb;
BEGIN
  PERFORM set_config('app.current_org', p_org::text, true);
  SELECT to_jsonb(s) - 'organization_id' - 'client_id'
  INTO v
  FROM mcp_client_signals s
  WHERE s.client_name ILIKE '%' || p_client_name || '%'
  ORDER BY s.total_outstanding DESC NULLS LAST, s.risk_score DESC
  LIMIT 1;
  IF v IS NULL THEN
    RETURN jsonb_build_object('matched', false, 'query', p_client_name);
  END IF;
  RETURN jsonb_build_object('matched', true) || v;
END;
$$;

-- 3. AR health — processed portfolio metrics (jsonb object).
CREATE OR REPLACE FUNCTION mcp_get_ar_health(p_org uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v jsonb;
BEGIN
  PERFORM set_config('app.current_org', p_org::text, true);
  WITH base AS (
    SELECT
      COALESCE(SUM(total_outstanding), 0) AS total_outstanding,
      COALESCE(SUM(total_overdue), 0) AS total_overdue,
      COALESCE(SUM(active_invoice_count), 0) AS active_invoice_count,
      COALESCE(SUM(invoices_overdue), 0) AS overdue_invoice_count,
      COUNT(*) FILTER (WHERE risk_score >= 7 AND total_outstanding > 0) AS high_risk_client_count,
      COALESCE(SUM(total_overdue) FILTER (WHERE risk_score >= 7), 0) AS cash_at_risk,
      COUNT(*) FILTER (WHERE total_outstanding > 0) AS active_clients,
      COUNT(*) FILTER (WHERE trend = 'worsening' AND total_outstanding > 0) AS worsening,
      COUNT(*) FILTER (WHERE trend = 'improving' AND total_outstanding > 0) AS improving
    FROM mcp_client_signals
  ),
  paidstats AS (
    SELECT COUNT(*) AS paid_count, COUNT(*) FILTER (WHERE last_payment_date <= due_date) AS on_time_count
    FROM (
      SELECT i.due_date,
             (SELECT MAX(p.payment_date) FROM payments p WHERE p.invoice_id = i.id) AS last_payment_date
      FROM invoices i
      WHERE (i.status IN ('paid', 'written_off')
             OR (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.invoice_id = i.id) >= i.amount)
    ) q
    WHERE last_payment_date IS NOT NULL AND due_date IS NOT NULL
  ),
  rev AS (
    SELECT COALESCE(SUM(p.amount), 0) AS rev_90
    FROM payments p WHERE p.payment_date >= CURRENT_DATE - 90
  ),
  inflow AS (
    SELECT COALESCE(SUM(
      GREATEST(i.amount - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0), 0)
      * COALESCE(cs.on_time_rate, 0.5)
    ), 0) AS est_inflow
    FROM invoices i
    LEFT JOIN mcp_client_signals cs ON cs.client_id = i.client_id
    WHERE i.status NOT IN ('paid', 'written_off')
      AND i.due_date IS NOT NULL AND i.due_date >= CURRENT_DATE AND i.due_date <= CURRENT_DATE + 30
  )
  SELECT jsonb_build_object(
    'health_score', LEAST(10, GREATEST(1, ROUND(
        10
      - (CASE WHEN base.total_outstanding > 0 THEN base.total_overdue / base.total_outstanding ELSE 0 END) * 4
      - (1 - CASE WHEN paidstats.paid_count > 0 THEN paidstats.on_time_count::numeric / paidstats.paid_count ELSE 1 END) * 3
      - (CASE WHEN base.active_clients > 0 THEN base.high_risk_client_count::numeric / base.active_clients ELSE 0 END) * 3
    ))),
    'total_outstanding', base.total_outstanding,
    'total_overdue', base.total_overdue,
    'collection_efficiency',
      CASE WHEN paidstats.paid_count > 0 THEN ROUND(paidstats.on_time_count::numeric / paidstats.paid_count, 2) END,
    'avg_days_sales_outstanding',
      CASE WHEN rev.rev_90 > 0 THEN ROUND(base.total_outstanding / (rev.rev_90 / 90.0)) END,
    'cash_at_risk', base.cash_at_risk,
    'estimated_cash_inflow_next_30_days', ROUND(inflow.est_inflow, 2),
    'overdue_invoice_count', base.overdue_invoice_count,
    'active_invoice_count', base.active_invoice_count,
    'high_risk_client_count', base.high_risk_client_count,
    'trend', CASE WHEN base.worsening > base.improving THEN 'worsening'
                  WHEN base.improving > base.worsening THEN 'improving' ELSE 'stable' END
  )
  INTO v
  FROM base, paidstats, rev, inflow;
  RETURN v;
END;
$$;

-- 4. Upcoming activity — invoices coming due with client risk + likelihood signals.
CREATE OR REPLACE FUNCTION mcp_get_upcoming_activity(p_org uuid, p_days integer)
RETURNS TABLE (
  invoice_number text, client_name text, amount numeric, currency text, due_date date,
  days_until_due integer, client_risk_score numeric, on_time_rate numeric,
  reminders_enabled boolean, next_reminder_at timestamptz, late_fee_may_apply boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.current_org', p_org::text, true);
  RETURN QUERY
  SELECT
    i.invoice_number,
    c.name,
    GREATEST(i.amount - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0), 0),
    i.currency,
    i.due_date,
    (i.due_date - CURRENT_DATE),
    s.risk_score,
    s.on_time_rate,
    i.reminders_enabled,
    i.next_send_at,
    EXISTS (SELECT 1 FROM late_fee_policies lfp WHERE lfp.active AND lfp.organization_id = i.organization_id)
  FROM invoices i
  JOIN clients c ON c.id = i.client_id
  LEFT JOIN mcp_client_signals s ON s.client_id = i.client_id
  WHERE i.status NOT IN ('paid', 'written_off')
    AND i.due_date IS NOT NULL
    AND i.due_date >= CURRENT_DATE
    AND i.due_date <= CURRENT_DATE + GREATEST(p_days, 1)
  ORDER BY i.due_date ASC;
END;
$$;

-- 5. Recent activity — processed summary of what happened (jsonb object).
CREATE OR REPLACE FUNCTION mcp_get_recent_activity(p_org uuid, p_days integer)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v jsonb; d integer := GREATEST(p_days, 1);
BEGIN
  PERFORM set_config('app.current_org', p_org::text, true);
  SELECT jsonb_build_object(
    'window_days', d,
    'payments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'client_name', c.name, 'amount', p.amount, 'payment_date', p.payment_date,
        'on_time', (i.due_date IS NOT NULL AND p.payment_date <= i.due_date)
      ) ORDER BY p.payment_date DESC)
      FROM payments p JOIN invoices i ON i.id = p.invoice_id LEFT JOIN clients c ON c.id = i.client_id
      WHERE p.payment_date >= CURRENT_DATE - d
    ), '[]'::jsonb),
    'payments_on_time_rate', (
      SELECT CASE WHEN COUNT(*) > 0
        THEN ROUND(AVG(((i.due_date IS NOT NULL AND p.payment_date <= i.due_date))::int)::numeric, 2) END
      FROM payments p JOIN invoices i ON i.id = p.invoice_id
      WHERE p.payment_date >= CURRENT_DATE - d
    ),
    'reminders_sent', (
      SELECT COUNT(*) FROM events e
      WHERE e.event_type = 'reminder_sent' AND e.created_at >= CURRENT_DATE - d
    ),
    'late_fees_applied', (
      SELECT jsonb_build_object('count', COUNT(*), 'amount', COALESCE(SUM(alf.amount), 0))
      FROM applied_late_fees alf JOIN invoices i ON i.id = alf.invoice_id
      WHERE alf.applied_at >= CURRENT_DATE - d
    )
  )
  INTO v;
  RETURN v;
END;
$$;

-- Own the signal functions as mcp_readonly (so they run SELECT-only) and expose
-- them only to the service role the server uses (never anon/authenticated, which
-- could otherwise call them with an arbitrary p_org).
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'mcp_get_action_center(uuid)',
    'mcp_get_client_risk_profile(uuid,text)',
    'mcp_get_ar_health(uuid)',
    'mcp_get_upcoming_activity(uuid,integer)',
    'mcp_get_recent_activity(uuid,integer)'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
    EXECUTE format('ALTER FUNCTION %s OWNER TO mcp_readonly', fn);
  END LOOP;
END
$$;
