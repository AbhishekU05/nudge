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
    <div className="space-y-4">
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/10"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="truncate text-base font-semibold text-white">
                  {reminder.recipient_name}
                </h3>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-white/10">
                  {reminder.recipient_email}
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-lg font-medium text-white">
                  ${Number(reminder.amount_owed).toFixed(2)}
                </span>
                <span className="text-sm text-zinc-400">
                  owed · sends every {reminder.reminder_frequency_days} day{reminder.reminder_frequency_days === 1 ? "" : "s"}
                </span>
              </div>

              {reminder.custom_message ? (
                <div className="mt-3.5 rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-zinc-400">
                  <span className="mr-1.5 select-none text-zinc-600">↳</span>
                  {reminder.custom_message}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <div className={`h-1.5 w-1.5 rounded-full ${reminder.active && !reminder.unsubscribed ? 'bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-zinc-600'}`} />
                  Next send: <span className="font-medium text-white">{formatDateTime(reminder.next_send_at)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  Last sent: {formatDateTime(reminder.last_sent_at)}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-row flex-wrap gap-2 pt-1 sm:flex-col sm:items-end">
              {isDevelopment && !reminder.unsubscribed ? (
                <form action={sendTestReminderEmail.bind(null, reminder.id)}>
                  <Button variant="ghost" size="sm" type="submit" className="w-full sm:w-auto text-zinc-300 hover:text-white border border-white/10 hover:bg-white/10">
                    Test email
                  </Button>
                </form>
              ) : null}

              {reminder.unsubscribed ? (
                <Button variant="ghost" size="sm" disabled className="w-full sm:w-auto opacity-40 border border-white/10 text-white">
                  Unsubscribed
                </Button>
              ) : reminder.active ? (
                <form action={pauseReminder.bind(null, reminder.id)}>
                  <Button variant="ghost" size="sm" type="submit" className="w-full sm:w-auto text-zinc-400 hover:text-white hover:bg-white/10">
                    Pause
                  </Button>
                </form>
              ) : (
                <form action={resumeReminder.bind(null, reminder.id)}>
                  <Button variant="ghost" size="sm" type="submit" className="w-full sm:w-auto text-zinc-300 hover:text-white border border-white/10 hover:bg-white/10">
                    Resume
                  </Button>
                </form>
              )}

              <form action={deleteReminder.bind(null, reminder.id)}>
                <Button variant="ghost" size="sm" type="submit" className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 sm:w-auto">
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
    <div className="flex min-h-screen flex-col relative overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[50rem] w-[50rem] -translate-x-1/2 -translate-y-1/4 rounded-full bg-white/5 blur-[120px]" />
      
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="min-w-0">
            <Link href="/" className="font-semibold tracking-wide text-white">
              Nudge
            </Link>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/feedback">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/10">
                Feedback
              </Button>
            </Link>
            <Link href="/settings/billing">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/10">
                Billing
              </Button>
            </Link>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit" className="text-zinc-400 hover:text-white hover:bg-white/10">
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
              <Card className="overflow-hidden border border-white/10 bg-black/40 backdrop-blur-2xl">
                <CardHeader className="pb-8 pt-10 text-center">
                  <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm">
                    <span className="flex h-2 w-2 rounded-full bg-white/60 mr-2"></span>
                    Dashboard Overview
                  </div>
                  <CardTitle className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-white sm:text-6xl">
                    Command center
                  </CardTitle>
                  <CardDescription className="mt-4 text-base md:text-lg text-zinc-400 max-w-xl mx-auto">
                    Track your active payment follow-ups and manage your client reminders effortlessly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 p-8 pt-0 sm:grid-cols-3">
                  <div className="group flex cursor-default flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/10">
                    <div className="text-4xl font-light tracking-tight text-white">
                      {activeReminders.length}
                    </div>
                    <div className="mt-2 text-[11px] font-medium uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400">
                      Active
                    </div>
                  </div>

                  <div className="group flex cursor-default flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/10">
                    <div className="text-4xl font-light tracking-tight text-white">
                      {pausedReminders.length}
                    </div>
                    <div className="mt-2 text-[11px] font-medium uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400">
                      Paused
                    </div>
                  </div>

                  <div className="group flex cursor-default flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/10">
                    <div className="text-2xl font-light capitalize tracking-tight text-white">
                      {hasSubscription
                        ? trialDaysLeft > 0
                          ? "Trial"
                          : "Active"
                        : subscriptionStatus}
                    </div>
                    <div className="mt-2 text-[11px] font-medium uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400">
                      Plan
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`flex flex-col justify-center border border-white/10 bg-black/40 p-8 backdrop-blur-2xl transition-all duration-300 hover:border-white/20 ${hasSubscription ? "" : "border-white/20"}`}>
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="font-serif text-2xl font-medium tracking-tight text-white">
                    {hasSubscription ? "Add a new reminder" : "Ready to start sending?"}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base text-zinc-400">
                    {hasSubscription
                      ? "Set up a new automated email sequence for another client."
                      : "Upgrade your account to activate automated reminder emails."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 p-0">
                  <div className="text-sm text-zinc-500">
                    {hasSubscription
                      ? "Your follow-up engine is running. Add a new recipient whenever you're ready."
                      : "Your existing reminder drafts are safely saved, but you'll need an active plan to start sending."}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href={hasSubscription ? "/reminders/new" : "/settings/billing"}>
                      <Button className="bg-white text-black hover:bg-zinc-200 w-full sm:w-auto border border-transparent">{hasSubscription ? "Create reminder" : "Open billing"}</Button>
                    </Link>
                    {!hasSubscription ? (
                      <Link href="/settings/billing">
                        <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/10 w-full sm:w-auto border border-white/10">See subscription status</Button>
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
              <Card className="border border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/20">
                <CardHeader className="p-8 pb-6">
                  <CardTitle className="font-serif text-3xl font-medium tracking-tight text-white">You haven't added any reminders yet</CardTitle>
                  <CardDescription className="text-base text-zinc-400 mt-2">
                    Start chasing your first payment with a gentle, automated cadence.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-8 p-8 pt-0 sm:flex-row sm:items-center sm:justify-between border-t border-white/5 mt-4 pt-8">
                  <p className="max-w-xl text-sm leading-relaxed text-zinc-500">
                    Every reminder we send is beautifully formatted, includes an easy unsubscribe link, and schedules the next follow-up automatically so you don't have to think about it.
                  </p>
                  <Link href={hasSubscription ? "/reminders/new" : "/settings/billing"}>
                    <Button className="bg-white text-black hover:bg-zinc-200 border border-transparent">
                      {hasSubscription ? "Create your first reminder" : "Activate billing"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Card className="border border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/20">
                  <CardHeader className="p-8 pb-6">
                    <CardTitle className="font-serif text-2xl font-medium tracking-tight text-white">Active Reminders</CardTitle>
                    <CardDescription className="text-zinc-400 mt-2">
                      These emails are running on autopilot. They'll stop automatically if the recipient unsubsribes or if you pause them.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    {activeReminders.length > 0 ? (
                      <ReminderList
                        isDevelopment={isDevelopment}
                        reminders={activeReminders}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 py-16 px-6 text-center">
                        <h3 className="text-sm font-medium text-white">No active reminders</h3>
                        <p className="mt-2 text-xs text-zinc-500">You don't have any follow-ups currently running.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/20">
                  <CardHeader className="p-8 pb-6">
                    <CardTitle className="font-serif text-2xl font-medium tracking-tight text-white">Paused Reminders</CardTitle>
                    <CardDescription className="text-zinc-400 mt-2">
                      These follow-ups are currently frozen. Resuming them will automatically schedule the next email at least 24 hours out.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    {pausedReminders.length > 0 ? (
                      <ReminderList
                        isDevelopment={isDevelopment}
                        reminders={pausedReminders}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 py-16 px-6 text-center">
                        <h3 className="text-sm font-medium text-white">No paused reminders</h3>
                        <p className="mt-2 text-xs text-zinc-500">Any reminders you freeze will appear here.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {unsubscribedReminders.length > 0 ? (
              <Card className="border border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/20">
                <CardHeader className="p-8 pb-6">
                  <CardTitle className="font-serif text-2xl font-medium tracking-tight text-white">Unsubscribed recipients</CardTitle>
                  <CardDescription className="text-zinc-400 mt-2">
                    These recipients opted out and won’t receive future reminders.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
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
