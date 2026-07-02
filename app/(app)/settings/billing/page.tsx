/*
 * billings page
 */
import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { startSubscriptionCheckout, cancelSubscription } from "@/app/actions/billing";
import { requireUser } from "@/lib/auth";
import { getOrganizationBillingForUser } from "@/lib/organization-billing";
import { getTrialDaysLeft, hasActiveSubscription } from "@/lib/payments";
import { getLocalizedMonthlyPrice } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// display billing message
// TODO: fix wording
function getBillingMessage(error?: string) {
  if (!error) return null;
  if (error === "subscription_required") {
    return "Start a subscription to create or resume reminders.";
  }
  if (error === "no_subscription") {
    return "No active subscription yet.";
  }
  if (error === "no_portal_url") {
    return "Billing is temporarily unavailable. Try again in a moment.";
  }
  return error;
}

// main function for billing page
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string; error?: string; success?: string }>;
}) {
  const user = await requireUser();
  const { canceled, error, success } = await searchParams;
  const monthlyPrice = await getLocalizedMonthlyPrice();
  const supabase = await createSupabaseServerClient();
  let org = null;
  let createdAt = new Date().toISOString();
  
  try {
    org = await getOrganizationBillingForUser(supabase, user.id);
    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("user_id", user.id)
      .single();
    if (profile) createdAt = profile.created_at;
  } catch (err) {
    org = null;
  }

  const status = org?.dodo_subscription_status ?? "none";
  // We don't have renews_at from Dodo stored yet, so we just say Active
  const renewsAt = status === "active" ? "Active" : null;
  const billingMessage = getBillingMessage(error);
  // Dodo subscriptions don't have a built in trial logic via created_at unless we track it
  const isActive = status === "active" || status === "on_hold";
  let trialDaysLeft = 0;

  // TODO: fix wording
  return (
    <div className="mx-auto max-w-6xl space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/30 sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(79,70,229,0.22),transparent_28rem),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.12),transparent_20rem)]" />
              <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
                <div>
                  <Badge variant={isActive ? "success" : "warning"} className="gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    {isActive ? "Plan enabled" : "Activate billing"}
                  </Badge>
                  <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.055em] text-zinc-50 sm:text-6xl">
                    Keep your collections workflow running.
                  </h1>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-500">
                    Duely billing unlocks customer tracking, payment history,
                    and reminder automation without adding accounting-system
                    overhead.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                      Monthly Plan
                    </p>
                    <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-50">
                      $29 / mo
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      Customer pipeline, payment logs, follow-up drafting, and automation controls.
                    </p>
                    <div className="mt-5">
                      {status === "active" && org?.plan_type === "monthly" ? (
                        <form action={cancelSubscription}>
                          <Button variant="secondary" type="submit" className="w-full text-red-400 hover:text-red-300">
                            Cancel subscription
                          </Button>
                        </form>
                      ) : (
                        <form action={startSubscriptionCheckout}>
                          <input type="hidden" name="plan" value="monthly" />
                          <Button type="submit" className="w-full">
                            <Zap className="h-3.5 w-3.5" />
                            {status === "active" ? "Switch to Monthly" : "Subscribe Monthly"}
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-5 backdrop-blur relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-emerald-500 text-emerald-950 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                      2 Months Free
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
                      Annual Plan
                    </p>
                    <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-50">
                      $290 <span className="text-sm font-normal text-zinc-400">/ yr</span>
                    </p>
                    <p className="mt-2 text-sm leading-6 text-emerald-100/50">
                      Everything in Monthly, plus 2 months free and priority support.
                    </p>
                    <div className="mt-5">
                      {status === "active" && org?.plan_type === "annual" ? (
                        <form action={cancelSubscription}>
                          <Button variant="secondary" type="submit" className="w-full text-red-400 hover:text-red-300">
                            Cancel subscription
                          </Button>
                        </form>
                      ) : (
                        <form action={startSubscriptionCheckout}>
                          <input type="hidden" name="plan" value="annual" />
                          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                            {status === "active" ? "Upgrade to Annual" : "Subscribe Annual"}
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="space-y-3">
              {success ? (
                <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {success === "true" || success === "" ? "Payment successful. Your plan will update shortly." : success}
                </p>
              ) : null}

              {canceled ? (
                <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-400">
                  Checkout canceled. No changes made.
                </p>
              ) : null}

              {billingMessage ? (
                <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {billingMessage}
                </p>
              ) : null}
            </div>

            {org?.domain === null && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold text-amber-100 text-base mb-1">Personal Email Detected</strong>
                    Because you signed up with a personal email address, this is an isolated solo workspace. You will not be able to invite or collaborate with team members for free on this workspace. 
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <section className="space-y-6">
                <Card className="border-white/10 bg-white/[0.03]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Plan status
                    </CardTitle>
                    <CardDescription>
                      Current access and renewal details for your workspace.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                        <p className="text-xs text-zinc-600">Status</p>
                        <p className="mt-2 text-sm font-semibold capitalize text-zinc-100">
                          {trialDaysLeft > 0 ? "free trial" : status}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                        <p className="text-xs text-zinc-600">Renews</p>
                        <p className="mt-2 text-sm font-semibold text-zinc-100">
                          {renewsAt ?? "Not scheduled"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                        <p className="text-xs text-zinc-600">Trial</p>
                        <p className="mt-2 text-sm font-semibold text-zinc-100">
                          {trialDaysLeft > 0
                            ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
                            : "Complete"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        "Track customers and balances",
                        "Log exact payment history",
                        "Draft follow-up messages",
                        "Enable reminder automation",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-300"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

              </section>

              <aside className="space-y-4">
                <Card className="bg-white/[0.025]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Reminder guardrails
                    </CardTitle>
                    <CardDescription>
                      Professional by default, protective by design.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-zinc-500">
                    Emails are sent no more than once every 24 hours, and every
                    message includes a clean one-click unsubscribe link.
                  </CardContent>
                </Card>

                <Card className="bg-white/[0.025]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-amber-300" />
                      Billing timing
                    </CardTitle>
                    <CardDescription>
                      Checkout and cancellation changes may take a moment to
                      sync from Dodo Payments.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </aside>
            </div>
    </div>
  );
}
