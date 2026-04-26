import Link from "next/link";

import { manageSubscription, startSubscriptionCheckout } from "@/app/actions/lemon";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/lemon";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string; error?: string; success?: string }>;
}) {
  const user = await requireUser();
  const { canceled, error, success } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("lemon_subscription_status,lemon_renews_at")
    .eq("user_id", user.id)
    .maybeSingle<{
      lemon_subscription_status: string | null;
      lemon_renews_at: string | null;
    }>();

  const status = profile?.lemon_subscription_status ?? "none";
  const renewsAt = profile?.lemon_renews_at
    ? new Date(profile.lemon_renews_at).toLocaleDateString()
    : null;
  const billingMessage = getBillingMessage(error);
  const isActive = hasActiveSubscription(status);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <Container className="flex h-14 items-center justify-between">
          <Link href="/dashboard" className="font-semibold tracking-tight text-zinc-900">
            ← Back
          </Link>
          <div className="text-sm text-zinc-600">Billing</div>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-10">
          <div className="mx-auto grid max-w-2xl gap-6">
            {success ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Checkout completed. Subscription status will refresh as soon as the webhook arrives.
              </p>
            ) : null}

            {canceled ? (
              <p className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
                Checkout was canceled. No changes were made.
              </p>
            ) : null}

            {billingMessage ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {billingMessage}
              </p>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>$1/month to send recurring reminders.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-zinc-600">
                  Status: <span className="capitalize">{status}</span>
                  {renewsAt ? ` · Renews ${renewsAt}` : ""}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <form action={startSubscriptionCheckout}>
                    <Button type="submit">
                      {isActive ? "Update subscription" : "Subscribe"}
                    </Button>
                  </form>
                  <form action={manageSubscription}>
                    <Button variant="secondary" type="submit">
                      Manage billing
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trust & safety</CardTitle>
                <CardDescription>
                  Transactional emails with unsubscribe support.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-zinc-600">
                We enforce a minimum 24 hour interval and basic rate limiting to
                reduce abuse.
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  );
}
