import Link from "next/link";

import { logout } from "@/app/actions/auth";
import {
  deleteReminder,
  pauseReminder,
  resumeReminder,
  sendTestReminderEmail,
} from "@/app/actions/reminders";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/lemon";
import { getLocalizedMonthlyPrice } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReminderRow } from "@/lib/types";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not sent yet";
  }

  return new Date(value).toLocaleString();
}

function ReminderList({
  isDevelopment,
  reminders,
}: {
  isDevelopment: boolean;
  reminders: ReminderRow[];
}) {
  return (
    <div className="space-y-3">
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className="rounded-2xl border border-zinc-200 bg-white p-4"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-medium text-zinc-900">
                  {reminder.recipient_name}
                </h3>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  {reminder.recipient_email}
                </span>
              </div>

              <p className="mt-2 text-sm text-zinc-600">
                ${Number(reminder.amount_owed).toFixed(2)} owed. Sends every{" "}
                {reminder.reminder_frequency_days} day
                {reminder.reminder_frequency_days === 1 ? "" : "s"}.
              </p>

              {reminder.custom_message ? (
                <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                  “{reminder.custom_message}”
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500">
                <span>Next send: {formatDateTime(reminder.next_send_at)}</span>
                <span>Last sent: {formatDateTime(reminder.last_sent_at)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isDevelopment && !reminder.unsubscribed ? (
                <form action={sendTestReminderEmail.bind(null, reminder.id)}>
                  <Button variant="secondary" size="sm" type="submit">
                    Send Test Email
                  </Button>
                </form>
              ) : null}

              {reminder.unsubscribed ? (
                <Button variant="secondary" size="sm" disabled>
                  Unsubscribed
                </Button>
              ) : reminder.active ? (
                <form action={pauseReminder.bind(null, reminder.id)}>
                  <Button variant="ghost" size="sm" type="submit">
                    Pause
                  </Button>
                </form>
              ) : (
                <form action={resumeReminder.bind(null, reminder.id)}>
                  <Button variant="secondary" size="sm" type="submit">
                    Resume
                  </Button>
                </form>
              )}

              <form action={deleteReminder.bind(null, reminder.id)}>
                <Button variant="danger" size="sm" type="submit">
                  Delete
                </Button>
              </form>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireUser();
  const { error, success } = await searchParams;
  const monthlyPrice = await getLocalizedMonthlyPrice();

  const supabase = await createSupabaseServerClient();
  const [{ data: reminders }, { data: profile }] = await Promise.all([
    supabase
      .from("reminders")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<ReminderRow[]>(),
    supabase
      .from("profiles")
      .select("lemon_subscription_status, lemon_renews_at, created_at")
      .eq("user_id", user.id)
      .maybeSingle<{
        lemon_subscription_status: string | null;
        lemon_renews_at: string | null;
        created_at: string;
      }>(),
  ]);

  const allReminders = reminders ?? [];
  const activeReminders = allReminders.filter(
    (reminder) => reminder.active && !reminder.unsubscribed,
  );
  const pausedReminders = allReminders.filter(
    (reminder) => !reminder.active && !reminder.unsubscribed,
  );
  const unsubscribedReminders = allReminders.filter(
    (reminder) => reminder.unsubscribed,
  );

  const subscriptionStatus = profile?.lemon_subscription_status ?? "none";
  const hasSubscription = hasActiveSubscription(
    subscriptionStatus,
    profile?.created_at,
  );
  const isDevelopment = process.env.NODE_ENV === "development";
  const renewsAt = profile?.lemon_renews_at
    ? new Date(profile.lemon_renews_at).toLocaleDateString()
    : null;

  let trialDaysLeft = 0;
  if (
    !renewsAt &&
    hasSubscription &&
    profile?.created_at &&
    subscriptionStatus !== "active"
  ) {
    const trialEnd = new Date(profile.created_at);
    trialEnd.setDate(trialEnd.getDate() + 14);
    trialDaysLeft = Math.ceil(
      (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <Container className="flex h-14 items-center justify-between gap-4">
          <div className="min-w-0">
            <Link href="/" className="font-semibold tracking-tight text-zinc-900">
              Nudge
            </Link>
            <p className="truncate text-sm text-zinc-500">{user.email}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/feedback">
              <Button variant="ghost" size="sm">
                Feedback
              </Button>
            </Link>
            <Link href="/settings/billing">
              <Button variant="secondary" size="sm">
                Billing
              </Button>
            </Link>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                Log out
              </Button>
            </form>
          </div>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-10">
          <div className="flex flex-col gap-8">
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Dashboard</CardTitle>
                  <CardDescription>
                    Track your active payment follow-ups and manage your client reminders effortlessly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-zinc-50 p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                      Active
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-zinc-900">
                      {activeReminders.length}
                    </div>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                      Paused
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-zinc-900">
                      {pausedReminders.length}
                    </div>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                      Plan
                    </div>
                    <div className="mt-2 text-lg font-semibold text-zinc-900 capitalize">
                      {hasSubscription
                        ? trialDaysLeft > 0
                          ? "Free Trial"
                          : "Active"
                        : subscriptionStatus}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {renewsAt
                        ? `Renews ${renewsAt}`
                        : trialDaysLeft > 0
                          ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
                          : `${monthlyPrice.standalone} to keep sending`}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={hasSubscription ? "" : "border-zinc-900"}>
                <CardHeader>
                  <CardTitle>
                    {hasSubscription ? "Add a new reminder" : "Ready to start sending?"}
                  </CardTitle>
                  <CardDescription>
                    {hasSubscription
                      ? "Set up a new automated email sequence for another client."
                      : "Upgrade your account to activate automated reminder emails."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-zinc-600">
                    {hasSubscription
                      ? "Your follow-up engine is running. Add a new recipient whenever you're ready."
                      : "Your existing reminder drafts are safely saved, but you'll need an active plan to start sending."}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link href={hasSubscription ? "/reminders/new" : "/settings/billing"}>
                      <Button>{hasSubscription ? "Create reminder" : "Open billing"}</Button>
                    </Link>
                    {!hasSubscription ? (
                      <Link href="/settings/billing">
                        <Button variant="secondary">See subscription status</Button>
                      </Link>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </section>

            {success ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </p>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {allReminders.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>You haven't added any reminders yet</CardTitle>
                  <CardDescription>
                    Start chasing your first payment with a gentle, automated cadence.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xl text-sm text-zinc-600">
                    Every reminder we send is beautifully formatted, includes an easy unsubscribe link, and schedules the next follow-up automatically so you don't have to think about it.
                  </p>
                  <Link href={hasSubscription ? "/reminders/new" : "/settings/billing"}>
                    <Button>
                      {hasSubscription ? "Create your first reminder" : "Activate billing"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Reminders</CardTitle>
                    <CardDescription>
                      These emails are running on autopilot. They'll stop automatically if the recipient unsubsribes or if you pause them.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeReminders.length > 0 ? (
                      <ReminderList
                        isDevelopment={isDevelopment}
                        reminders={activeReminders}
                      />
                    ) : (
                      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
                        No active reminders right now.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Paused Reminders</CardTitle>
                    <CardDescription>
                      These follow-ups are currently frozen. Resuming them will automatically schedule the next email at least 24 hours out.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pausedReminders.length > 0 ? (
                      <ReminderList
                        isDevelopment={isDevelopment}
                        reminders={pausedReminders}
                      />
                    ) : (
                      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
                        No paused reminders.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {unsubscribedReminders.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Unsubscribed recipients</CardTitle>
                  <CardDescription>
                    These recipients opted out and won’t receive future reminders.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReminderList
                    isDevelopment={isDevelopment}
                    reminders={unsubscribedReminders}
                  />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </Container>
      </main>
    </div>
  );
}
