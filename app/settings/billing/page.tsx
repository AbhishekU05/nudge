/*
 * billings page
 */
import Link from "next/link";

import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";

import { manageSubscription, startSubscriptionCheckout } from "@/app/actions/lemon";
import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getTrialDaysLeft, hasActiveSubscription } from "@/lib/lemon";
import { getLocalizedMonthlyPrice } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// display billing message
// TODO: fix wording
function getBillingMessage(error?: string) {
  if (!error) return null;
  if (error === "subscription_required") {
    return "Start the subscription before creating or resuming reminders.";
  }
  if (error === "no_subscription") {
    return "There is no active subscription to manage yet.";
  }
  if (error === "no_portal_url") {
    return "Billing portal is not available yet. Try again in a moment.";
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("lemon_subscription_status,lemon_renews_at,created_at")
    .eq("user_id", user.id)
    .maybeSingle<{
      lemon_subscription_status: string | null;
      lemon_renews_at: string | null;
      created_at: string;
    }>();

  const status = profile?.lemon_subscription_status ?? "none";
  const renewsAt = profile?.lemon_renews_at
    ? new Date(profile.lemon_renews_at).toLocaleDateString()
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
            {isActive ? "Active access" : "Action needed"}
          </Badge>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="space-y-6">
              <div>
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                  Billing
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
                  Keep automated payment reminders running without exposing
                  billing complexity in the main workflow.
                </p>
              </div>

              <div className="space-y-3">
                {success ? (
                  <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    Checkout completed. Subscription status will refresh when
                    the webhook arrives.
                  </p>
                ) : null}

                {canceled ? (
                  <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-400">
                    Checkout was canceled. No changes were made.
                  </p>
                ) : null}

                {billingMessage ? (
                  <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {billingMessage}
                  </p>
                ) : null}
              </div>

              <Card className="bg-white/[0.035]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Your plan
                  </CardTitle>
                  <CardDescription>
                    {monthlyPrice.standalone} to automate your payment
                    follow-ups completely.
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

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <form action={startSubscriptionCheckout}>
                      <Button type="submit" className="w-full sm:w-auto">
                        {isActive ? "Update subscription" : "Subscribe"}
                      </Button>
                    </form>
                    <form action={manageSubscription}>
                      <Button variant="secondary" type="submit" className="w-full sm:w-auto">
                        Manage billing
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </section>

            <aside>
              <Card className="bg-white/[0.025]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Promise
                  </CardTitle>
                  <CardDescription>
                    Professional by default, protective by design.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-zinc-500">
                  Emails are sent no more than once every 24 hours, and every
                  message includes a clean one-click unsubscribe link. No spam,
                  just gentle nudges.
                </CardContent>
              </Card>
            </aside>
          </div>
        </Container>
      </main>
    </div>
  );
}
