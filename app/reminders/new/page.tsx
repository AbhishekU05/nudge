import Link from "next/link";

import { createReminder } from "@/app/actions/reminders";
import { Container } from "@/components/site/container";
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
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/lemon";
import { getLocalizedMonthlyPrice } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewReminderPage({
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
    .select("lemon_subscription_status")
    .eq("user_id", user.id)
    .maybeSingle<{ lemon_subscription_status: string | null }>();

  const hasSubscription = hasActiveSubscription(
    profile?.lemon_subscription_status ?? null,
  );

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <Container className="flex h-14 items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="font-semibold tracking-tight text-zinc-900"
          >
            ← Back
          </Link>
          <div className="text-sm text-zinc-600">Create reminder</div>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-10">
          <div className="mx-auto grid max-w-3xl gap-6">
            {!hasSubscription ? (
              <Card className="border-zinc-900">
                <CardHeader>
                  <CardTitle>Subscription required</CardTitle>
                  <CardDescription>
                    Reminder creation is gated until billing is active.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xl text-sm text-zinc-600">
                    Activate the {monthlyPrice.inline} plan to create reminders
                    and unlock the sending pipeline.
                  </p>
                  <Link href="/settings/billing">
                    <Button>Open billing</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : null}

            <Card className={!hasSubscription ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle>New reminder</CardTitle>
                <CardDescription>
                  Minimum interval is 24 hours. Recipients can unsubscribe any
                  time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createReminder} className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="recipient_name">Recipient name</Label>
                    <Input
                      id="recipient_name"
                      name="recipient_name"
                      placeholder="Sam Carter"
                      maxLength={100}
                      required
                      disabled={!hasSubscription}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipient_email">Recipient email</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="amount_owed">Amount owed (USD)</Label>
                    <Input
                      id="amount_owed"
                      name="amount_owed"
                      inputMode="decimal"
                      placeholder="42.00"
                      required
                      disabled={!hasSubscription}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reminder_frequency_days">Frequency (days)</Label>
                    <Input
                      id="reminder_frequency_days"
                      name="reminder_frequency_days"
                      type="number"
                      min={1}
                      defaultValue={7}
                      required
                      disabled={!hasSubscription}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="custom_message">Custom message</Label>
                    <Textarea
                      id="custom_message"
                      name="custom_message"
                      maxLength={500}
                      placeholder="Short, calm context for the reminder."
                      disabled={!hasSubscription}
                    />
                    <p className="text-xs text-zinc-500">
                      Optional. Keep it short and factual.
                    </p>
                  </div>

                  {error ? (
                    <div className="sm:col-span-2">
                      <p
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                        role="alert"
                      >
                        {error}
                      </p>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end gap-2 sm:col-span-2">
                    <Link href="/dashboard">
                      <Button type="button" variant="secondary">
                        Cancel
                      </Button>
                    </Link>
                    <Button type="submit" disabled={!hasSubscription}>
                      Create reminder
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  );
}
