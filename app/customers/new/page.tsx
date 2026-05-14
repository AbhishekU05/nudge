/*
 * /customers/new — Add a customer to the pipeline.
 * Collects only the essentials: name, email, amount owed, currency, due date.
 * Automation is a separate, optional step (/reminders/new?customer_id=...).
 */
import Link from "next/link";
import { ArrowLeft, UserPlus, Zap } from "lucide-react";

import { createCustomer } from "@/app/actions/customers";
import { Container } from "@/components/site/container";
import { CurrencySelect } from "@/components/site/currency-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/payments";
import { getLocalizedMonthlyPrice } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;
  const monthlyPrice = await getLocalizedMonthlyPrice();

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("razorpay_subscription_status, created_at")
    .eq("user_id", user.id)
    .maybeSingle<{
      razorpay_subscription_status: string | null;
      created_at: string;
    }>();

  const hasSubscription = hasActiveSubscription(
    profile?.razorpay_subscription_status ?? null,
    profile?.created_at,
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <Badge variant={hasSubscription ? "success" : "warning"}>
            {hasSubscription ? "Plan active" : "Billing required"}
          </Badge>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            {/* Main form */}
            <section className="space-y-6">
              <div>
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                  Add customer
                </h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-zinc-500">
                  Track who owes you what. Log payments, set promises, and
                  follow up — all from the dashboard. Add automated reminders
                  later if you need to escalate.
                </p>
              </div>

              {!hasSubscription && (
                <Card className="border-amber-500/20 bg-amber-500/10">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-amber-100">
                        Billing required
                      </p>
                      <p className="mt-1 text-sm leading-6 text-amber-100/70">
                        Activate your plan for {monthlyPrice.inline} to start
                        tracking customers.
                      </p>
                    </div>
                    <Link href="/settings/billing">
                      <Button>Open billing</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              <Card className={cn("bg-white/[0.035]", !hasSubscription && "opacity-60")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Customer details
                  </CardTitle>
                  <CardDescription>
                    Basic info only — no email will be sent yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={createCustomer} className="grid gap-5 sm:grid-cols-2">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="recipient_name">Customer name</Label>
                      <Input
                        id="recipient_name"
                        name="recipient_name"
                        placeholder="Sam Carter"
                        maxLength={100}
                        required
                        disabled={!hasSubscription}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="recipient_email">Customer email</Label>
                      <Input
                        id="recipient_email"
                        name="recipient_email"
                        type="email"
                        placeholder="sam@example.com"
                        maxLength={320}
                        required
                        disabled={!hasSubscription}
                      />
                    </div>

                    {/* Amount + currency */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="nc_amount_owed">Total amount due</Label>
                      <div className="flex gap-2">
                        <div className="w-[100px]">
                          <CurrencySelect
                            id="nc_currency"
                            name="currency"
                            disabled={!hasSubscription}
                          />
                        </div>
                        <Input
                          id="nc_amount_owed"
                          name="amount_owed"
                          inputMode="decimal"
                          placeholder="420.00"
                          required
                          disabled={!hasSubscription}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Due date */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="due_date">
                        Due date{" "}
                        <span className="text-zinc-600">(optional)</span>
                      </Label>
                      <Input
                        id="due_date"
                        name="due_date"
                        type="date"
                        disabled={!hasSubscription}
                        className="max-w-[200px]"
                      />
                      <p className="text-xs text-zinc-600">
                        Used to show overdue status in your pipeline.
                      </p>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="sm:col-span-2">
                        <p
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                          role="alert"
                        >
                          {error}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end">
                      <Link href="/dashboard">
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                      </Link>
                      <Button
                        type="submit"
                        disabled={!hasSubscription}
                        className="w-full sm:w-auto"
                      >
                        Add customer
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </section>

            {/* Sidebar info */}
            <aside className="space-y-4">
              <Card className="bg-white/[0.025]">
                <CardContent className="p-5">
                  <div className="flex gap-3">
                    <div className="mt-0.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-400">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">
                        Automation is optional
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                        Once a customer is added, you can enable automated
                        email reminders from the dashboard — choose your tone
                        and frequency at that point.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02]">
                <CardContent className="p-5 text-sm leading-6 text-zinc-500">
                  <p className="font-medium text-zinc-300">What happens next?</p>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
                      Customer appears in your pipeline immediately.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
                      Log partial payments and record promises from the
                      dashboard.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
                      Enable automated reminders anytime — pick the tone and
                      frequency that fits the situation.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </aside>
          </div>
        </Container>
      </main>
    </div>
  );
}
