/*
 * actual dashboard landing page
 */
import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Inbox,
  Mail,
  Pause,
  PauseCircle,
  Plus,
  Send,
  Zap,
} from "lucide-react";

import { logout } from "@/app/actions/auth";
import {
  createReminder,
  deleteReminder,
  pauseReminder,
  resumeReminder,
  sendTestReminderEmail,
} from "@/app/actions/reminders";
import { Container } from "@/components/site/container";
import { CurrencySelect } from "@/components/site/currency-select";
import { LocalTime } from "@/components/site/local-time";
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
import { getTrialDaysLeft, hasActiveSubscription } from "@/lib/payments";
import { getLocalizedMonthlyPrice } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReminderRow } from "@/lib/types";
import { cn } from "@/lib/utils";

// TODO: create a contact us page

// formats numbers into currency
// TODO: format currency based on client location
function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat(undefined, {
    currency: currency,
    style: "currency",
  }).format(Number(value));
}

// get user initials for icons
function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// shows what subscription plan is active
function getPlanLabel({
  hasSubscription,
  subscriptionStatus,
  trialDaysLeft,
}: {
  hasSubscription: boolean;
  subscriptionStatus: string;
  trialDaysLeft: number;
}) {
  if (hasSubscription && trialDaysLeft > 0) {
    return `${trialDaysLeft} trial day${trialDaysLeft === 1 ? "" : "s"} left`;
  }

  if (hasSubscription) {
    return "Active plan";
  }

  return subscriptionStatus === "none" ? "No active plan" : subscriptionStatus;
}

// alert box
function Notice({
  children,
  variant,
}: {
  children: string;
  variant: "success" | "error";
}) {
  return (
    <p
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        variant === "success" &&
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
        variant === "error" && "border-red-500/20 bg-red-500/10 text-red-200",
      )}
      role={variant === "error" ? "alert" : undefined}
    >
      {children}
    </p>
  );
}

// shows status of reminder
// TODO: Fix display message
function ReminderStatus({ reminder }: { reminder: ReminderRow }) {
  if (reminder.unsubscribed) {
    return <Badge variant="danger">Unsubscribed</Badge>;
  }

  if (reminder.active) {
    return <Badge variant="success">Active</Badge>;
  }

  return <Badge variant="warning">Paused</Badge>;
}

// displays a single reminder
// TODO: Fix wording. Replace "cadence" with something else
function ReminderCard({
  isDevelopment,
  reminder,
}: {
  isDevelopment: boolean;
  reminder: ReminderRow;
}) {
  const isMuted = !reminder.active || reminder.unsubscribed;

  return (
    <Card
      className={cn(
        "bg-white/[0.025] transition-colors hover:border-white/20",
        isMuted && "bg-white/[0.018]",
      )}
    >
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-zinc-300">
                {getInitials(reminder.recipient_name)}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold tracking-tight text-zinc-50">
                  {reminder.recipient_name}
                </h3>
                <p className="truncate text-sm text-zinc-500">
                  {reminder.recipient_email}
                </p>
              </div>
              <ReminderStatus reminder={reminder} />
            </div>

            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-zinc-600">Amount</p>
                <p className="mt-1 font-semibold text-zinc-100">
                  {formatCurrency(Number(reminder.amount_owed), reminder.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-600">Schedule</p>
                <p className="mt-1 text-zinc-300">
                  Every {reminder.reminder_frequency_days} day
                  {reminder.reminder_frequency_days === 1 ? "" : "s"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-600">Next send</p>
                <p className="mt-1 text-zinc-300">
                  {reminder.unsubscribed || !reminder.active ? (
                    "Not scheduled"
                  ) : (
                    <LocalTime value={reminder.next_send_at} />
                  )}
                </p>
              </div>
            </div>

            {reminder.custom_message ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-background/60 px-3.5 py-3 text-sm leading-6 text-zinc-400">
                {reminder.custom_message}
              </div>
            ) : null}

            <p className="mt-4 text-xs text-zinc-600">
              Last sent: <LocalTime value={reminder.last_sent_at} />
            </p>
          </div>

          <div className="flex shrink-0 flex-row flex-wrap gap-2 sm:justify-end">
            {isDevelopment && !reminder.unsubscribed ? (
              <form action={sendTestReminderEmail.bind(null, reminder.id)}>
                <Button variant="secondary" size="sm" type="submit">
                  Test
                </Button>
              </form>
            ) : null}

            {reminder.unsubscribed ? (
              <Button variant="secondary" size="sm" disabled>
                Stopped
              </Button>
            ) : reminder.active ? (
              <form action={pauseReminder.bind(null, reminder.id)}>
                <Button variant="secondary" size="sm" type="submit">
                  Pause
                </Button>
              </form>
            ) : (
              <form action={resumeReminder.bind(null, reminder.id)}>
                <Button variant="primary" size="sm" type="submit">
                  Resume
                </Button>
              </form>
            )}

            <form action={deleteReminder.bind(null, reminder.id)}>
              <Button variant="ghost" size="sm" type="submit">
                Mark as paid
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// for when no reminders exist
// TODO: Fix wording
function EmptyActiveState({ hasSubscription }: { hasSubscription: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-500">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-zinc-50">
        No reminders yet
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        Create your first reminder and Duely will follow up automatically until you’re paid.
      </p>
      <div className="mt-6">
        <Link href={hasSubscription ? "/reminders/new" : "/settings/billing"}>
          <Button>
            {hasSubscription ? "Create your first reminder" : "Activate billing"}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// fast way to create reminder card
// TODO: fix wording. replace "cadence" with something else
function QuickCreateCard({
  hasSubscription,
  monthlyPrice,
}: {
  hasSubscription: boolean;
  monthlyPrice: string;
}) {
  return (
    <Card className="bg-white/[0.035]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          Quick create
        </CardTitle>
        <CardDescription>
          Create a reminder in seconds. We’ll follow up automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasSubscription ? (
          <>
            <form action={createReminder} className="space-y-3">
              <input type="hidden" name="reminder_frequency_days" value="7" />
              <div>
                <Label htmlFor="quick_recipient_name" className="sr-only">
                  Recipient name
                </Label>
                <Input
                  id="quick_recipient_name"
                  name="recipient_name"
                  placeholder="Client name"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quick_recipient_email" className="sr-only">
                  Recipient email
                </Label>
                <Input
                  id="quick_recipient_email"
                  name="recipient_email"
                  type="email"
                  placeholder="client@example.com"
                  maxLength={320}
                  required
                />
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                <div className="flex gap-2 col-span-2 sm:col-span-1">
                  <div className="w-[100px]">
                    <Label htmlFor="quick_currency" className="sr-only">Currency</Label>
                    <CurrencySelect id="quick_currency" name="currency" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="quick_amount_owed" className="sr-only">
                      Amount owed
                    </Label>
                    <Input
                      id="quick_amount_owed"
                      name="amount_owed"
                      inputMode="decimal"
                      placeholder="Amount"
                      required
                    />
                  </div>
                </div>
                <Button type="submit">Create reminder</Button>
              </div>
            </form>
            <Link
              href="/reminders/new"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-400 hover:text-zinc-100"
            >
              Open full composer
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </>
        ) : (
          <div className="space-y-5">
            {/* TODO: uh wtf is this shit. re word this shit*/}
            <p className="text-sm leading-6 text-zinc-500">
              Activate your plan to create and resume automated reminders.
              Duely is {monthlyPrice}.
            </p>
            <Link href="/settings/billing">
              <Button className="w-full">Open billing</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type TimelineEvent = {
  at: string;
  detail: string;
  id: string;
  title: string;
  tone: "primary" | "success" | "muted" | "warning";
};

// converts activities into timeline events
function buildTimeline(reminders: ReminderRow[]): TimelineEvent[] {
  const events = reminders.flatMap((reminder) => {
    const entries: Array<TimelineEvent | null> = [
      reminder.active && !reminder.unsubscribed
        ? {
          at: reminder.next_send_at,
          detail: `${reminder.recipient_name} · ${formatCurrency(Number(reminder.amount_owed), reminder.currency)}`,
          id: `${reminder.id}-next`,
          title: "Next reminder queued",
          tone: "primary",
        }
        : null,
      reminder.last_sent_at
        ? {
          at: reminder.last_sent_at,
          detail: reminder.recipient_name,
          id: `${reminder.id}-sent`,
          title: "Reminder sent",
          tone: "success",
        }
        : null,
      !reminder.active && !reminder.unsubscribed
        ? {
          at: reminder.updated_at,
          detail: reminder.recipient_name,
          id: `${reminder.id}-paused`,
          title: "Reminder paused",
          tone: "warning",
        }
        : null,
      reminder.unsubscribed
        ? {
          at: reminder.updated_at,
          detail: reminder.recipient_name,
          id: `${reminder.id}-unsubscribed`,
          title: "Recipient opted out",
          tone: "muted",
        }
        : null,
    ];

    return entries.filter((entry): entry is TimelineEvent => Boolean(entry));
  });

  const now = Date.now();

  return events
    .sort((a, b) => {
      const aTime = new Date(a.at).getTime();
      const bTime = new Date(b.at).getTime();
      const aFuture = aTime >= now;
      const bFuture = bTime >= now;

      if (aFuture && bFuture) {
        return aTime - bTime;
      }

      if (aFuture !== bFuture) {
        return aFuture ? -1 : 1;
      }

      return bTime - aTime;
    })
    .slice(0, 6);
}

// ui for the timeline
function ActivityTimeline({ reminders }: { reminders: ReminderRow[] }) {
  const timeline = buildTimeline(reminders);

  return (
    <Card className="bg-white/[0.025]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-primary" />
          Activity
        </CardTitle>
        <CardDescription>
          Track when reminders are sent and when payments are resolved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {timeline.length > 0 ? (
          <div className="space-y-5">
            {timeline.map((event) => (
              <div key={event.id} className="flex gap-3">
                <span
                  className={cn(
                    "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                    event.tone === "primary" && "bg-primary",
                    event.tone === "success" && "bg-emerald-400",
                    event.tone === "warning" && "bg-amber-400",
                    event.tone === "muted" && "bg-zinc-600",
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">
                    {event.title}
                  </p>
                  <p className="mt-1 truncate text-sm text-zinc-500">
                    {event.detail}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    <LocalTime value={event.at} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm leading-6 text-zinc-500">
            No activity yet. It’ll appear once you create your first reminder.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// main dashboard page logic
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
      .select("razorpay_subscription_status, razorpay_renews_at, created_at")
      .eq("user_id", user.id)
      .maybeSingle<{
        razorpay_subscription_status: string | null;
        razorpay_renews_at: string | null;
        created_at: string;
      }>(),
  ]);

  // TODO: make sure this subscription logic is perfect. we don't want freeloaders on the website
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

  const subscriptionStatus = profile?.razorpay_subscription_status ?? "none";
  const hasSubscription = hasActiveSubscription(
    subscriptionStatus,
    profile?.created_at,
  );
  const isDevelopment = process.env.NODE_ENV === "development";
  const renewsAt = profile?.razorpay_renews_at
    ? new Date(profile.razorpay_renews_at).toLocaleDateString()
    : null;

  let trialDaysLeft = 0;
  if (
    !renewsAt &&
    hasSubscription &&
    profile?.created_at &&
    subscriptionStatus !== "active"
  ) {
    trialDaysLeft = getTrialDaysLeft(profile.created_at);
  }

  const planLabel = getPlanLabel({
    hasSubscription,
    subscriptionStatus,
    trialDaysLeft,
  });

  // TODO: add logic to prevent users from adding reminders if they've hit their limit on the plan
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              width={32}
              height={32}
              alt="Duely Logo"
              className="h-8 w-8 rounded-md"
            />
            <span className="text-2xl font-semibold tracking-tight text-zinc-50">
              Duely
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/feedback">
              <Button variant="ghost" size="sm">
                Feedback
              </Button>
            </Link>
            <Link href="/settings/billing">
              <Button variant="ghost" size="sm">
                Billing
              </Button>
            </Link>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                Log out
              </Button>
            </form>
          </nav>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant={hasSubscription ? "success" : "warning"}>
                {planLabel}
              </Badge>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                Reminders
              </h1>
              {/* TODO: wtf change this wording*/}
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
                Create a reminder. Duely follows up until you get paid.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-white/[0.03] p-3 text-center">
              <div className="px-3 py-2">
                <div className="text-2xl font-semibold text-zinc-50">
                  {activeReminders.length}
                </div>
                <div className="mt-1 text-xs text-zinc-600">Active</div>
              </div>
              <div className="px-3 py-2">
                <div className="text-2xl font-semibold text-zinc-50">
                  {pausedReminders.length}
                </div>
                <div className="mt-1 text-xs text-zinc-600">Paused</div>
              </div>
              <div className="px-3 py-2">
                <div className="text-2xl font-semibold text-zinc-50">
                  {unsubscribedReminders.length}
                </div>
                <div className="mt-1 text-xs text-zinc-600">Unsubscribed</div>
              </div>
            </div>
          </div>

          <div className="mb-5 space-y-3">
            {success ? <Notice variant="success">{success}</Notice> : null}
            {error ? <Notice variant="error">{error}</Notice> : null}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="space-y-5">
              <Card className="bg-white/[0.035]">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-500" />
                      Active reminders
                    </CardTitle>
                    {/* TODO: bruh wording. change it. wtf. */}
                    <CardDescription>
                      These reminders are running automatically.
                    </CardDescription>
                  </div>
                  <Link href={hasSubscription ? "/reminders/new" : "/settings/billing"}>
                    <Button size="sm">
                      <Plus className="h-3.5 w-3.5" />
                      New reminder
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeReminders.length > 0 ? (
                    activeReminders.map((reminder) => (
                      <ReminderCard
                        isDevelopment={isDevelopment}
                        key={reminder.id}
                        reminder={reminder}
                      />
                    ))
                  ) : (
                    <EmptyActiveState hasSubscription={hasSubscription} />
                  )}
                </CardContent>
              </Card>

              {pausedReminders.length > 0 || unsubscribedReminders.length > 0 ? (
                <Card className="bg-white/[0.02]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <Pause className="h-4 w-4 text-zinc-400" />
                    Quiet reminders
                  </CardTitle>
                    {/* TODO: why you telling the user that. change it*/}
                    <CardDescription>
                      Paused and unsubscribed reminders stay here
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[...pausedReminders, ...unsubscribedReminders].map(
                      (reminder) => (
                        <ReminderCard
                          isDevelopment={isDevelopment}
                          key={reminder.id}
                          reminder={reminder}
                        />
                      ),
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </section>

            <aside className="space-y-5">
              <QuickCreateCard
                hasSubscription={hasSubscription}
                monthlyPrice={monthlyPrice.inline}
              />

              <ActivityTimeline reminders={allReminders} />

              {!hasSubscription || renewsAt || trialDaysLeft > 0 ? (
                <Card className="bg-white/[0.02]">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full border border-white/10 bg-white/[0.04] p-2 text-zinc-400">
                        {hasSubscription ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {hasSubscription ? "Plan is ready" : "Billing needed"}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-zinc-500">
                          {renewsAt
                            ? `Renews ${renewsAt}.`
                            : trialDaysLeft > 0
                              ? `${trialDaysLeft} trial day${trialDaysLeft === 1 ? "" : "s"} remaining.`
                              : `Subscribe for ${monthlyPrice.inline} to send reminders.`}
                        </p>
                        <Link
                          href="/settings/billing"
                          className="mt-3 inline-flex text-sm font-medium text-zinc-300 hover:text-zinc-50"
                        >
                          Manage billing
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </aside>
          </div>
        </Container>
      </main>
    </div>
  );
}
