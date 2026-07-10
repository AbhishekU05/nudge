/* eslint-disable */
/*
 * Dashboard — workflow-first collections view.
 * Replaced the automation-first reminder list with a pipeline grouped by
 * workflow_status. The DashboardClient component handles the interactive
 * drawer and groupings; this file stays pure server-side data loading.
 */
import Image from "next/image";
import Link from "next/link";

import {
  ChevronDown,
  UserRound,
} from "lucide-react";

import { logout, updateProfileName } from "@/app/actions/auth";
import { Container } from "@/components/site/container";
import { DashboardClient } from "@/components/site/dashboard-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { getTrialDaysLeft, hasActiveSubscription } from "@/lib/payments";
import { getLocalizedMonthlyPrice } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CustomerEvent, CustomerRecord, FollowUpLog, PaymentLog } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CurrencySelector } from "@/components/site/currency-selector";
import { getDaysOverdue, isEffectivelyPaid, getRemainingBalance } from "@/lib/types";

type CustomerRow = Omit<CustomerRecord, "payment_history" | "followup_history">;

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

import { getDisplayName, getInitials } from "@/lib/utils";

function getPlanLabel({
  hasSubscription,
  subscriptionStatus,
  trialDaysLeft,
}: {
  hasSubscription: boolean;
  subscriptionStatus: string;
  trialDaysLeft: number;
}) {
  if (hasSubscription && trialDaysLeft > 0) {
    return `${trialDaysLeft} trial day${trialDaysLeft === 1 ? "" : "s"} left`;
  }
  if (hasSubscription) return "Active plan";
  return subscriptionStatus === "none" ? "No active plan" : subscriptionStatus;
}

function Notice({
  children,
  variant,
}: {
  children: string;
  variant: "success" | "error";
}) {
  return (
    <p
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        variant === "success" &&
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
        variant === "error" && "border-red-500/20 bg-red-500/10 text-red-200",
      )}
      role={variant === "error" ? "alert" : undefined}
    >
      {children}
    </p>
  );
}

// ──────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; groupId?: string; currency?: string }>;
}) {
  const user = await requireUser();
  const { error, success, groupId, currency: urlCurrency } = await searchParams;
  const monthlyPrice = await getLocalizedMonthlyPrice();

  const supabase = await createSupabaseServerClient();

  // Distinct currencies (RLS-scoped) drive the selector and the default:
  // USD if the org has USD invoices, otherwise its first currency.
  const { data: currencyData } = await supabase.rpc("get_invoice_currencies");
  const orgCurrencies = (currencyData as string[] | null) || [];
  const uniqueCurrencies = Array.from(new Set([...orgCurrencies, "USD"])).sort();
  const defaultCurrency = orgCurrencies.includes("USD") ? "USD" : orgCurrencies[0] || "USD";
  const selectedCurrency = urlCurrency || defaultCurrency;

  const [pipelineRes, orgMembersRes, groupsRes] = await Promise.all([
    supabase.rpc("get_invoices_pipeline", {
      p_currency: selectedCurrency,
      p_group_id: groupId || null,
      p_bucket_limit: 30,
    }),
    supabase
      .from("organization_members")
      .select("role, organizations(dodo_subscription_status, dodo_next_billing_date, created_at)")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("groups").select("*").order("name", { ascending: true }),
  ]);

  if (pipelineRes.error) console.error("Pipeline RPC error:", pipelineRes.error);

  const rpcData = pipelineRes.data as any;
  const pipelines = {
    overdue: (rpcData?.overdue?.rows || []) as CustomerRecord[],
    outstanding: (rpcData?.outstanding?.rows || []) as CustomerRecord[],
    paid: (rpcData?.paid?.rows || []) as CustomerRecord[],
  };
  const totals = rpcData?.totals || {
    outstandingAmount: 0, overdueCount: 0, outstandingCount: 0, paidCount: 0, optedOutCount: 0,
  };

  // Active group label
  let activeGroup: any = null;
  if (groupId) {
    activeGroup = (groupsRes.data || []).find((g: any) => g.id === groupId) || null;
  }

  const profile = orgMembersRes.data?.organizations ? {
    razorpay_subscription_status: (orgMembersRes.data.organizations as any).dodo_subscription_status,
    razorpay_renews_at: (orgMembersRes.data.organizations as any).dodo_next_billing_date,
    created_at: (orgMembersRes.data.organizations as any).created_at,
  } : null;


  const subscriptionStatus = profile?.razorpay_subscription_status ?? "none";
  const hasSubscription = hasActiveSubscription(subscriptionStatus, profile?.created_at, profile?.razorpay_renews_at);
  // isDevelopment removed

  const renewsAt = profile?.razorpay_renews_at
    ? new Date(profile.razorpay_renews_at).toLocaleDateString()
    : null;

  const displayName = getDisplayName(
    user.user_metadata?.full_name,
    user.email?.split("@")[0] ?? "Profile",
  );

  let trialDaysLeft = 0;
  if (hasSubscription && subscriptionStatus !== "active") {
    trialDaysLeft = getTrialDaysLeft(profile?.created_at, subscriptionStatus, profile?.razorpay_renews_at);
  }

  const planLabel = getPlanLabel({ hasSubscription, subscriptionStatus, trialDaysLeft });

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Main ─────────────────────────────────────────── */}
      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          {/* Page heading */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {activeGroup && (
                <div className="mb-2">
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border border-zinc-800 bg-zinc-900/50 text-zinc-300">
                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: activeGroup.color || "#3b82f6" }} />
                    {activeGroup.name}
                  </span>
                </div>
              )}
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                Invoices
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
                Track what invoices owe, log payments, record promises, and follow up — all in one place.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:items-end">
              <div className="flex items-center justify-end w-full">
                <CurrencySelector currencies={uniqueCurrencies} selected={selectedCurrency} />
              </div>

              <Link href={hasSubscription ? "/invoices/new" : "/settings/billing"} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto gap-2">
                  <UserRound className="h-4 w-4" />
                  Add invoice
                </Button>
              </Link>
            </div>
          </div>

          {/* Notices */}
          {(success || error) && (
            <div className="mb-6 space-y-3">
              {success && <Notice variant="success">{success}</Notice>}
              {error && <Notice variant="error">{error}</Notice>}
            </div>
          )}

          {/* Client-side pipeline + drawer */}
          <DashboardClient
            pipelines={pipelines}
            totals={totals}
            hasSubscription={hasSubscription}
          />
        </Container>
      </main>
    </div>
  );
}
