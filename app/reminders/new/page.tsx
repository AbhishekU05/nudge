/*
 * reminder page 
 */
import Link from "next/link";

import { ArrowLeft, Clock3, MailPlus, MessageSquare } from "lucide-react";

import { createReminder } from "@/app/actions/reminders";
import { Container } from "@/components/site/container";
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
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/lemon";
import { getLocalizedMonthlyPrice } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

// main function for reminder page
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
    .select("lemon_subscription_status, created_at")
    .eq("user_id", user.id)
    .maybeSingle<{
      lemon_subscription_status: string | null;
      created_at: string;
    }>();

    // TODO: ensure reminders created only if under quota
  const hasSubscription = hasActiveSubscription(
    profile?.lemon_subscription_status ?? null,
    profile?.created_at,
  );

  // TODO: change all wordings
  return (
    <div className="flex min-h-screen flex-col">
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
            {hasSubscription ? "Ready to send" : "Billing required"}
          </Badge>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
            <section className="space-y-6">
              <div>
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                  Create a nudge
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
                  Add the essential details and Nudge will send calm reminders
                  until the payment is resolved.
                </p>
              </div>

              {!hasSubscription ? (
                <Card className="border-amber-500/20 bg-amber-500/10">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-amber-100">
                        Your trial has ended.
                      </p>
                      <p className="mt-1 text-sm leading-6 text-amber-100/70">
                        Activate billing for {monthlyPrice.inline} to create or
                        resume automated reminders.
                      </p>
                    </div>
                    <Link href="/settings/billing">
                      <Button>Open billing</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : null}

              <Card className={cn("bg-white/[0.035]", !hasSubscription && "opacity-60")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <MailPlus className="h-5 w-5 text-primary" />
                    Reminder details
                  </CardTitle>
                  <CardDescription>
                    Keep it simple. The email stays professional and includes an
                    unsubscribe link automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={createReminder} className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="recipient_name">Client name</Label>
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
                      <Label htmlFor="recipient_email">Client email</Label>
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
                      <Label htmlFor="amount_owed">Amount owed</Label>
                      <Input
                        id="amount_owed"
                        name="amount_owed"
                        inputMode="decimal"
                        placeholder="420.00"
                        required
                        disabled={!hasSubscription}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reminder_frequency_days">
                        Cadence in days
                      </Label>
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
                      <Label htmlFor="custom_message">Optional note</Label>
                      <Textarea
                        id="custom_message"
                        name="custom_message"
                        maxLength={500}
                        placeholder="Example: Following up on invoice #1234."
                        disabled={!hasSubscription}
                      />
                      <p className="text-xs text-zinc-600">
                        Short, factual notes work best. Maximum 500 characters.
                      </p>
                    </div>

                    {error ? (
                      <div className="sm:col-span-2">
                        <p
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                          role="alert"
                        >
                          {error}
                        </p>
                      </div>
                    ) : null}

                    <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end">
                      <Link href="/dashboard">
                        <Button type="button" variant="secondary" className="w-full sm:w-auto">
                          Cancel
                        </Button>
                      </Link>
                      <Button type="submit" disabled={!hasSubscription} className="w-full sm:w-auto">
                        Create nudge
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </section>

            <aside className="space-y-5">
              <Card className="bg-white/[0.025]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Email tone
                  </CardTitle>
                  <CardDescription>
                    The reminder reads like a polite message, not a collection
                    notice.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-6 text-zinc-400">
                  <div className="rounded-2xl border border-white/10 bg-background/70 p-4">
                    <p className="font-medium text-zinc-200">
                      Subject: Friendly payment reminder
                    </p>
                    <p className="mt-3">Hi Sam,</p>
                    <p className="mt-3">
                      Just floating this back to the top of your inbox. The
                      balance is still outstanding.
                    </p>
                    <p className="mt-3 text-zinc-500">
                      If you have already paid, please disregard this note.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02]">
                <CardContent className="p-5">
                  <div className="flex gap-3">
                    <div className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-zinc-400">
                      <Clock3 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        First send is scheduled automatically.
                      </p>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">
                        Backend scheduling and rate limits are unchanged. This
                        page only changes how the workflow feels.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </Container>
      </main>
    </div>
  );
}
