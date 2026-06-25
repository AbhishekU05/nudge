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
  searchParams: Promise<{ error?: string; success?: string; groupId?: string }>;
}) {
  const user = await requireUser();
  const { error, success, groupId } = await searchParams;
  const monthlyPrice = await getLocalizedMonthlyPrice();

  const supabase = await createSupabaseServerClient();
  let customers = null;
  let customerEvents = null;
  let profile = null;
  let xeroIntegration = null;
  let quickbooksIntegration = null;
  let activeGroup = null;

  try {
    const [customersRes, eventsRes, profileRes, xeroRes, qbRes, customerGroupsRes, groupsRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<CustomerRow[]>(),
      supabase
        .from("customer_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .returns<CustomerEvent[]>(),
      supabase
        .from("profiles")
        .select("razorpay_subscription_status, razorpay_renews_at, created_at")
        .eq("user_id", user.id)
        .maybeSingle<{
          razorpay_subscription_status: string | null;
          razorpay_renews_at: string | null;
          created_at: string;
        }>(),
      supabase
        .from("integrations")
        .select("provider")
        .eq("user_id", user.id)
        .eq("provider", "xero")
        .maybeSingle<{ provider: string }>(),
      supabase
        .from("integrations")
        .select("provider")
        .eq("user_id", user.id)
        .eq("provider", "quickbooks")
        .maybeSingle<{ provider: string }>(),
      supabase
        .from("customer_groups")
        .select("*"),
      supabase
        .from("groups")
        .select("*")
        .eq("user_id", user.id),
    ]);
    
    customers = customersRes.data;
    customerEvents = eventsRes.data;
    profile = profileRes.data;
    xeroIntegration = xeroRes.data;
    quickbooksIntegration = qbRes.data;

    if (groupId && customers) {
      const customerGroupsList = customerGroupsRes.data || [];
      const groupsList = groupsRes.data || [];
      activeGroup = groupsList.find((g) => g.id === groupId) || null;
      
      const groupCustomerIds = customerGroupsList
        .filter((cg) => cg.group_id === groupId)
        .map((cg) => cg.customer_id);
      customers = customers.filter((c) => groupCustomerIds.includes(c.customer_id || ""));
    }
  } catch (err) {
    // Graceful fallback
  }

  const logsByCustomer = new Map<string, PaymentLog[]>();
  const followupsByCustomer = new Map<string, FollowUpLog[]>();

  for (const event of customerEvents ?? []) {
    if (event.event_type === "payment") {
      const payment: PaymentLog = {
        id: event.id,
        invoice_id: event.invoice_id,
        customer_id: event.customer_id,
        user_id: event.user_id,
        amount: Number(event.amount),
        currency: event.currency ?? "USD",
        source: event.payment_source ?? "user",
        created_at: event.created_at,
      };
      const existing = logsByCustomer.get(event.customer_id) ?? [];
      existing.push(payment);
      logsByCustomer.set(event.customer_id, existing);
      continue;
    }

    if (event.event_type === "followup") {
      const followup: FollowUpLog = {
        id: event.id,
        invoice_id: event.invoice_id,
        customer_id: event.customer_id,
        user_id: event.user_id,
        followup_date: event.event_date,
        method: event.followup_method ?? "other",
        note: event.note,
        outcome: event.followup_outcome ?? "no_response",
        created_at: event.created_at,
      };
      const existing = followupsByCustomer.get(event.customer_id) ?? [];
      existing.push(followup);
      followupsByCustomer.set(event.customer_id, existing);
    }
  }

  const _allCustomers = (customers ?? []).map((customer) => ({
    ...customer,
    payment_history: logsByCustomer.get(customer.id) ?? [],
    followup_history: followupsByCustomer.get(customer.id) ?? [],
  }));

  const uniqueCurrencies = Array.from(new Set(_allCustomers.map(c => c.currency || 'USD'))).sort();
  const searchParamsAwaited = await searchParams;
  const urlCurrency = (searchParamsAwaited as any).currency as string | undefined;
  const selectedCurrency = urlCurrency || (uniqueCurrencies.includes('USD') ? 'USD' : uniqueCurrencies[0] || 'USD');
  const allCustomers = _allCustomers.filter(c => (c.currency || 'USD') === selectedCurrency);

  const subscriptionStatus = profile?.razorpay_subscription_status ?? "none";
  const hasSubscription = hasActiveSubscription(subscriptionStatus, profile?.created_at, profile?.razorpay_renews_at);
  const isDevelopment = process.env.NODE_ENV === "development";

  const renewsAt = profile?.razorpay_renews_at
    ? new Date(profile.razorpay_renews_at).toLocaleDateString()
    : null;

  const displayName = getDisplayName(
    user.user_metadata?.full_name,
    user.email?.split("@")[0] ?? "Profile",
  );

  let trialDaysLeft = 0;
  if (hasSubscription && profile?.created_at && subscriptionStatus !== "active") {
    trialDaysLeft = getTrialDaysLeft(profile.created_at, subscriptionStatus, profile?.razorpay_renews_at);
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
            customers={allCustomers}
            hasSubscription={hasSubscription}
            isDevelopment={isDevelopment}
            currency={selectedCurrency}
          />
        </Container>
      </main>
    </div>
  );
}
