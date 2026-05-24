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
import type { CustomerRecord, PaymentLog, FollowUpLog } from "@/lib/types";
import { cn } from "@/lib/utils";

type CustomerRow = Omit<CustomerRecord, "payment_history" | "followup_history">;

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDisplayName(name: string | null | undefined, fallback: string) {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireUser();
  const { error, success } = await searchParams;
  const monthlyPrice = await getLocalizedMonthlyPrice();

  const supabase = await createSupabaseServerClient();

  const [
    { data: customers },
    { data: paymentLogs },
    { data: followupLogs },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("reminders")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<CustomerRow[]>(),
    supabase
      .from("payment_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<PaymentLog[]>(),
    supabase
      .from("followup_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<FollowUpLog[]>(),
    supabase
      .from("profiles")
      .select("razorpay_subscription_status, razorpay_renews_at, created_at")
      .eq("user_id", user.id)
      .maybeSingle<{
        razorpay_subscription_status: string | null;
        razorpay_renews_at: string | null;
        created_at: string;
      }>(),
  ]);

  const logsByCustomer = new Map<string, PaymentLog[]>();
  for (const log of paymentLogs ?? []) {
    const existing = logsByCustomer.get(log.reminder_id) ?? [];
    existing.push(log);
    logsByCustomer.set(log.reminder_id, existing);
  }

  const followupsByCustomer = new Map<string, FollowUpLog[]>();
  for (const log of followupLogs ?? []) {
    const existing = followupsByCustomer.get(log.reminder_id) ?? [];
    existing.push(log);
    followupsByCustomer.set(log.reminder_id, existing);
  }

  const allCustomers = (customers ?? []).map((customer) => ({
    ...customer,
    payment_history: logsByCustomer.get(customer.id) ?? [],
    followup_history: followupsByCustomer.get(customer.id) ?? [],
  }));

  const subscriptionStatus = profile?.razorpay_subscription_status ?? "none";
  const hasSubscription = hasActiveSubscription(subscriptionStatus, profile?.created_at);
  const isDevelopment = process.env.NODE_ENV === "development";

  const renewsAt = profile?.razorpay_renews_at
    ? new Date(profile.razorpay_renews_at).toLocaleDateString()
    : null;

  const displayName = getDisplayName(
    user.user_metadata?.full_name,
    user.email?.split("@")[0] ?? "Profile",
  );

  let trialDaysLeft = 0;
  if (!renewsAt && hasSubscription && profile?.created_at && subscriptionStatus !== "active") {
    trialDaysLeft = getTrialDaysLeft(profile.created_at);
  }

  const planLabel = getPlanLabel({ hasSubscription, subscriptionStatus, trialDaysLeft });

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              width={32}
              height={32}
              alt="Duely Logo"
              className="h-8 w-8 rounded-md"
            />
            <span className="text-2xl font-semibold tracking-tight text-zinc-50">
              Duely
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/feedback">
              <Button variant="ghost" size="sm">
                Feedback
              </Button>
            </Link>
            <Link href="/settings/billing">
              <Button variant="ghost" size="sm">
                Billing
              </Button>
            </Link>

            {/* Profile dropdown */}
            <details className="relative">
              <summary className="flex h-8 cursor-pointer list-none items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-sm text-zinc-200 transition-colors hover:bg-white/[0.08] [&::-webkit-details-marker]:hidden">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[10px] font-semibold text-zinc-100">
                  {getInitials(displayName)}
                </span>
                <span className="hidden max-w-28 truncate sm:inline">
                  {displayName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-72 rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/30">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-zinc-200">
                    {getInitials(displayName)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-zinc-100">{displayName}</div>
                    <div className="truncate text-xs text-zinc-500">{user.email}</div>
                  </div>
                </div>
                <form action={updateProfileName} className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor="dashboard_profile_name"
                      className="flex items-center gap-2 text-xs text-zinc-400"
                    >
                      <UserRound className="h-3.5 w-3.5" />
                      Profile name
                    </Label>
                    <Input
                      id="dashboard_profile_name"
                      name="full_name"
                      defaultValue={displayName}
                      maxLength={100}
                      required
                    />
                  </div>
                  <Button type="submit" size="sm" className="w-full">
                    Save name
                  </Button>
                </form>
              </div>
            </details>

            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                Log out
              </Button>
            </form>
          </nav>
        </Container>
      </header>

      {/* ── Main ─────────────────────────────────────────── */}
      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          {/* Page heading */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant={hasSubscription ? "success" : "warning"}>
                {planLabel}
              </Badge>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                Collections
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
                Track what customers owe, log payments, record promises, and follow up — all in one place.
              </p>
            </div>

            {/* Billing status pill */}
            {(!hasSubscription || renewsAt || trialDaysLeft > 0) && (
              <div className="shrink-0 rounded-xl border border-border bg-white/[0.025] px-4 py-3 text-sm">
                <p className="font-medium text-zinc-200">
                  {hasSubscription ? "Plan active" : "Billing needed"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {renewsAt
                    ? `Renews ${renewsAt}`
                    : trialDaysLeft > 0
                      ? `${trialDaysLeft} trial day${trialDaysLeft === 1 ? "" : "s"} left`
                      : `Subscribe for ${monthlyPrice.inline}`}
                </p>
                {!hasSubscription && (
                  <Link
                    href="/settings/billing"
                    className="mt-1.5 inline-flex text-xs font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    Manage billing →
                  </Link>
                )}
              </div>
            )}
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
          />
        </Container>
      </main>
    </div>
  );
}
