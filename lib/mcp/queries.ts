import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// AR *signal* reads for the MCP tools. Every function calls a SECURITY DEFINER
// RPC (see supabase/migrations/20260716000000_mcp_signal_tools.sql) that runs as
// the SELECT-only mcp_readonly role and pins app.current_org, so the database
// enforces read-only access and single-org scoping. These return pre-computed
// signals (risk scores, rates, trends) — never raw rows, and never anything
// Claude should derive itself. This module only ever calls these org-scoped RPCs.

export async function getActionCenter(organizationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("mcp_get_action_center", { p_org: organizationId });
  if (error) throw new Error(error.message);
  type Row = {
    client_name: string;
    recommended_action: string;
    priority: string;
    amount_at_stake: number;
    days_overdue: number;
    invoice_count: number;
    client_risk_score: number;
    consecutive_missed_actions: number;
    avg_days_from_due: number;
    on_time_rate: number | null;
  };
  return ((data ?? []) as Row[]).map((r) => ({
    client_name: r.client_name,
    recommended_action: r.recommended_action,
    priority: r.priority,
    amount_at_stake: Number(r.amount_at_stake),
    days_overdue: Number(r.days_overdue),
    invoice_count: Number(r.invoice_count),
    client_risk_score: Number(r.client_risk_score),
    consecutive_missed_actions: Number(r.consecutive_missed_actions),
    avg_days_from_due: Number(r.avg_days_from_due),
    on_time_rate: r.on_time_rate == null ? null : Number(r.on_time_rate),
  }));
}

export async function getClientRiskProfile(organizationId: string, clientName: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("mcp_get_client_risk_profile", {
    p_org: organizationId,
    p_client_name: clientName,
  });
  if (error) throw new Error(error.message);
  // The RPC returns a fully-formed signal object (or { matched: false }).
  return data ?? { matched: false, query: clientName };
}

export async function getArHealth(organizationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("mcp_get_ar_health", { p_org: organizationId });
  if (error) throw new Error(error.message);
  return data ?? {};
}

export async function getUpcomingActivity(organizationId: string, days = 7) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("mcp_get_upcoming_activity", {
    p_org: organizationId,
    p_days: Math.max(1, Math.floor(days)),
  });
  if (error) throw new Error(error.message);
  type Row = {
    invoice_number: string | null;
    client_name: string | null;
    amount: number;
    currency: string | null;
    due_date: string | null;
    days_until_due: number;
    client_risk_score: number | null;
    on_time_rate: number | null;
    reminders_enabled: boolean;
    next_reminder_at: string | null;
    late_fee_may_apply: boolean;
  };
  return ((data ?? []) as Row[]).map((r) => ({
    invoice_number: r.invoice_number,
    client_name: r.client_name,
    amount: Number(r.amount),
    currency: r.currency,
    due_date: r.due_date,
    days_until_due: Number(r.days_until_due),
    client_risk_score: r.client_risk_score == null ? null : Number(r.client_risk_score),
    on_time_rate: r.on_time_rate == null ? null : Number(r.on_time_rate),
    reminders_enabled: r.reminders_enabled,
    next_reminder_at: r.next_reminder_at,
    late_fee_may_apply: r.late_fee_may_apply,
  }));
}

export async function getRecentActivity(organizationId: string, days = 7) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("mcp_get_recent_activity", {
    p_org: organizationId,
    p_days: Math.max(1, Math.floor(days)),
  });
  if (error) throw new Error(error.message);
  return data ?? {};
}
