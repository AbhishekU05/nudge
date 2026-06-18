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
import { startSubscriptionCheckout, cancelSubscription } from "@/app/actions/razorpay";
import { requireUser } from "@/lib/auth";
import { getTrialDaysLeft, hasActiveSubscription } from "@/lib/payments";
import { getLocalizedMonthlyPrice } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  let profile = null;
  let stripeConnection = null;

  try {
    const [profileRes, stripeRes] = await Promise.all([
      supabase
      .from("profiles")
      .select("razorpay_subscription_status,razorpay_renews_at,created_at")
      .eq("user_id", user.id)
      .maybeSingle<{
        razorpay_subscription_status: string | null;
        razorpay_renews_at: string | null;
        created_at: string;
      }>(),
      supabase
        .from("stripe_connections")
        .select("stripe_account_id, webhook_secret")
        .eq("user_id", user.id)
        .maybeSingle<{ stripe_account_id: string | null; webhook_secret: string | null }>(),
    ]);
    profile = profileRes.data;
    stripeConnection = stripeRes.data;
  } catch (err) {
    // Graceful fallback on error
    profile = null;
    stripeConnection = null;
  }

  const status = profile?.razorpay_subscription_status ?? "none";
  const renewsAt = profile?.razorpay_renews_at
    ? new Date(profile.razorpay_renews_at).toLocaleDateString()
    : null;
  const billingMessage = getBillingMessage(error);
  const isActive = hasActiveSubscription(status, profile?.created_at);

  let trialDaysLeft = 0;
  if (!renewsAt && isActive && profile?.created_at && status !== "active") {
    trialDaysLeft = getTrialDaysLeft(profile.created_at);
  }

  // TODO: fix wording
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <Badge variant={isActive ? "success" : "warning"}>
            {isActive ? "Active plan" : "Action required"}
          </Badge>
        </Container>
      </header>

      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
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

                <div className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                    Basic plan
                  </p>
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-50">
                    {monthlyPrice.standalone}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Customer pipeline, payment logs, follow-up drafting, and
                    automation controls.
                  </p>
                  <div className="mt-5">
                    {status === "active" ? (
                      <form action={cancelSubscription}>
                        <Button
                          variant="secondary"
                          type="submit"
                          className="w-full text-red-400 hover:text-red-300"
                        >
                          Cancel subscription
                        </Button>
                      </form>
                    ) : (
                      <form action={startSubscriptionCheckout}>
                        <Button type="submit" className="w-full">
                          <Zap className="h-3.5 w-3.5" />
                          {trialDaysLeft > 0 ? "Upgrade to basic plan" : "Subscribe"}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="space-y-3">
              {success ? (
                <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  Payment successful. Your plan will update shortly.
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

                <details className="group rounded-xl border border-white/10 bg-white/[0.03] open:bg-white/[0.04] transition-colors">
                  <summary className="flex cursor-pointer items-center justify-between p-6 font-medium text-zinc-100 marker:content-none select-none">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span className="text-xl">Stripe Integration</span>
                      <Badge variant="warning" className="uppercase text-[10px] tracking-wider px-2 py-0.5 ml-2">Beta</Badge>
                    </div>
                    <span className="transition-transform duration-200 group-open:rotate-180 text-zinc-500">
                      <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </span>
                  </summary>
                  <div className="border-t border-white/10 p-6 pt-4 text-sm text-zinc-400 space-y-6">
                    <p className="leading-relaxed">
                      In your Stripe Dashboard go to <strong>Developers &rarr; Webhooks</strong>, add the above URL as an endpoint, and select <code>invoice.created</code> and <code>invoice.paid</code> as events. Paste the signing secret below.
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Webhook URL</label>
                        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-zinc-300 overflow-x-auto whitespace-nowrap">
                          https://duely.in/api/stripe/webhook?user_id={user.id}
                        </div>
                      </div>

                      <form
                        action={async (formData) => {
                          "use server";
                          const secret = formData.get("webhook_secret") as string;
                          if (!secret) return;
                          
                          const user = await requireUser();
                          const supabase = await createSupabaseServerClient();
                          
                          await supabase.from("stripe_connections").upsert({
                            user_id: user.id,
                            webhook_secret: secret,
                          }, { onConflict: "user_id" });
                          
                          revalidatePath("/settings/billing");
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <label htmlFor="webhook_secret" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Signing Secret</label>
                          <input
                            type="password"
                            id="webhook_secret"
                            name="webhook_secret"
                            placeholder="whsec_..."
                            defaultValue={stripeConnection?.webhook_secret ?? ""}
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            required
                          />
                        </div>
                        <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                          <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                          Save Secret
                        </Button>
                      </form>
                    </div>
                  </div>
                </details>
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
                      sync from Razorpay.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </aside>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
