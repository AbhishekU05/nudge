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
import { CheckoutButton } from "./checkout-button";
import { requireUser } from "@/lib/auth";
import { getOrganizationBillingForUser } from "@/lib/organization-billing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; canceled?: string; error?: string; success?: string }>;
}) {
  const user = await requireUser();
  const { status, canceled, error, success } = await searchParams;
  const supabase = await createSupabaseServerClient();
  let org = null;
  let createdAt = new Date().toISOString();
  
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    org = await getOrganizationBillingForUser(supabaseAdmin, user.id);
    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("user_id", user.id)
      .single();
    if (profile) createdAt = profile.created_at;
  } catch (err) {
    org = null;
  }

  const rawStatus = org?.dodo_subscription_status ?? "none";
  const billingMessage = getBillingMessage(error);

  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const trialDaysLeft = Math.max(0, 7 - diffDays);
  
  let displayStatus = "";
  let renewsText = "Not scheduled";
  let renewsLabel = "Renews";

  if (rawStatus === "active" || rawStatus === "on_hold") {
    displayStatus = org?.plan_type === "annual" ? "Annual Active" : "Monthly Active";
    renewsText = "Active"; // We don't have renewsAt stored natively yet
  } else if (trialDaysLeft > 0) {
    displayStatus = "Trial";
    renewsLabel = "Trial ends";
    const trialEndDate = new Date(createdDate);
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    renewsText = trialEndDate.toLocaleDateString();
  } else {
    displayStatus = "Inactive";
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Billing & Plans</h1>
        <p className="mt-2 text-sm text-zinc-400">Manage your workspace subscription and payment details.</p>
      </div>

      <div className="space-y-3">
        {(success === "true" || status === "succeeded" || status === "active" || status === "setup") ? (
          <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Payment successful. Your plan will update shortly.
          </p>
        ) : null}

        {(canceled === "true" || status === "cancelled" || status === "failed") ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-400">
            Checkout canceled or payment failed. No changes made.
          </p>
        ) : null}

        {billingMessage ? (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {billingMessage}
          </p>
        ) : null}
      </div>

      {!org?.domain && (
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

      {/* Plan Status above cards */}
      <Card className="border-white/10 bg-white/[0.03] max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CreditCard className="h-5 w-5 text-primary" />
            Plan status
          </CardTitle>
          <CardDescription>
            Current access and renewal details for your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-xs text-zinc-600">Status</p>
              <p className="mt-2 text-sm font-semibold capitalize text-zinc-100">
                {displayStatus}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-xs text-zinc-600">{renewsLabel}</p>
              <p className="mt-2 text-sm font-semibold text-zinc-100">
                {renewsText}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 sm:grid-cols-2 lg:max-w-4xl">
        {/* Monthly Card (Landing Page style) */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 flex flex-col">
          <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Monthly
          </p>
          <p className="mt-4 flex items-end gap-2 text-4xl font-bold text-zinc-50">
            $29 <span className="text-base font-medium text-zinc-500 mb-1">/ month</span>
          </p>
          <p className="mt-1 text-sm text-zinc-500">for your entire team &mdash; cancel any time</p>
          <ul className="mt-8 space-y-3 text-sm text-zinc-400 flex-1">
            <li className="font-medium text-zinc-300 mb-1">Everything included:</li>
            {[
              "Unlimited team members",
              "Unlimited clients & invoices",
              "Automated reminders & sequences",
              "Xero & QuickBooks sync",
              "Client portal & payment logging",
              "Activity timeline & CSV exports",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-indigo-400">✓</span> {item}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {rawStatus === "active" && org?.plan_type === "monthly" ? (
              <CheckoutButton action={cancelSubscription} variant="cancel" className="w-full text-red-400 hover:text-red-300 h-12">
                Cancel subscription
              </CheckoutButton>
            ) : (
              <CheckoutButton action={startSubscriptionCheckout} plan="monthly" variant="monthly" className="w-full h-12 bg-white/10 hover:bg-white/20 text-zinc-100">
                {rawStatus === "active" ? "Switch to Monthly" : "Subscribe Monthly"}
              </CheckoutButton>
            )}
          </div>
        </div>

        {/* Annual Card (Landing Page style) */}
        <div className="relative rounded-xl border border-emerald-500/40 bg-emerald-500/[0.06] p-8 overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 bg-emerald-500 text-emerald-950 text-[10px] font-bold px-3 py-1.5 rounded-bl-lg uppercase tracking-wider">
            2 Months Free
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Annual
          </p>
          <p className="mt-4 flex items-end gap-2 text-4xl font-bold text-zinc-50">
            $290 <span className="text-base font-medium text-emerald-500/60 mb-1">/ year</span>
          </p>
          <p className="mt-1 text-sm text-emerald-500/60">for your entire team &mdash; save $58</p>
          <ul className="mt-8 space-y-3 text-sm text-zinc-400 flex-1">
            <li className="font-medium text-emerald-300/80 mb-1">Everything in Monthly, plus:</li>
            {[
              "Unlimited team members",
              "Priority support",
              "2 months free",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> {item}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {rawStatus === "active" && org?.plan_type === "annual" ? (
              <CheckoutButton action={cancelSubscription} variant="cancel" className="w-full text-red-400 hover:text-red-300 h-12">
                Cancel subscription
              </CheckoutButton>
            ) : (
              <CheckoutButton action={startSubscriptionCheckout} plan="annual" variant="annual" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12">
                {rawStatus === "active" ? "Upgrade to Annual" : "Subscribe Annual"}
              </CheckoutButton>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
