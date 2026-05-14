"use client";

/*
 * DashboardClient — the interactive shell for the workflow-first dashboard.
 * Manages which customer's drawer is open; all data fetching stays in the
 * server page component (dashboard/page.tsx).
 */

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  ChevronRight,
  Plus,
  Zap,
  Link2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CustomerDrawer } from "@/components/site/customer-drawer";
import { LocalTime } from "@/components/site/local-time";
import { cn } from "@/lib/utils";
import type { CustomerRecord, WorkflowStatus } from "@/lib/types";
import { getRemainingBalance, getDaysOverdue, isEffectivelyPaid } from "@/lib/types";
import Link from "next/link";
import { createReminder } from "@/app/actions/reminders";
import { CurrencySelect } from "@/components/site/currency-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, { currency, style: "currency" }).format(Number(value));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
  WorkflowStatus,
  { label: string; variant: "success" | "warning" | "danger" | "muted" | "default" }
> = {
  outstanding: { label: "Outstanding", variant: "warning" },
  promised: { label: "Promised", variant: "default" },
  partial: { label: "Partial", variant: "default" },
  paid: { label: "Paid", variant: "success" },
  overdue: { label: "Overdue", variant: "danger" },
  written_off: { label: "Written off", variant: "muted" },
};

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: "red" | "amber" | "emerald" | "indigo";
}) {
  const iconColors = {
    red: "text-red-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    indigo: "text-indigo-400",
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white/[0.025] p-4">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]",
          accent && iconColors[accent],
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-zinc-50">{value}</p>
        <p className="mt-0.5 text-xs text-zinc-600">{label}</p>
        {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Customer card (pipeline row)
// ---------------------------------------------------------------------------
function CustomerCard({
  customer,
  onOpen,
}: {
  customer: CustomerRecord;
  onOpen: (c: CustomerRecord) => void;
}) {
  const remaining = getRemainingBalance(customer);
  const daysOverdue = getDaysOverdue(customer);
  const status = customer.workflow_status;
  const statusCfg = STATUS_CONFIG[status];
  const paid = isEffectivelyPaid(customer);

  return (
    <button
      type="button"
      onClick={() => onOpen(customer)}
      className={cn(
        "group w-full rounded-2xl border border-border bg-white/[0.025] p-4 text-left transition-colors hover:border-white/20 hover:bg-white/[0.04]",
        paid && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-zinc-300">
            {getInitials(customer.recipient_name)}
          </div>
          {/* Info */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-zinc-100">
                {customer.recipient_name}
              </span>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              {daysOverdue && (
                <Badge variant="danger">{daysOverdue}d overdue</Badge>
              )}
              {customer.promised_date && status === "promised" && (
                <Badge variant="default">
                  Promised {new Date(customer.promised_date).toLocaleDateString()}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-zinc-600">
              {customer.recipient_email}
            </p>
          </div>
        </div>

        {/* Amount + chevron */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-100">
              {formatCurrency(remaining, customer.currency)}
            </p>
            {customer.amount_paid > 0 && (
              <p className="mt-0.5 text-xs text-zinc-600">
                {formatCurrency(Number(customer.amount_paid), customer.currency)} paid
              </p>
            )}
            {customer.due_date && (
              <p
                className={cn(
                  "mt-0.5 text-xs",
                  daysOverdue ? "text-red-400" : "text-zinc-600",
                )}
              >
                Due {new Date(customer.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-700 transition-colors group-hover:text-zinc-400" />
        </div>
      </div>

      {/* Mini payment progress bar */}
      {customer.amount_paid > 0 && !paid && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-emerald-500/70"
            style={{
              width: `${Math.min(100, (Number(customer.amount_paid) / Number(customer.amount_owed)) * 100)}%`,
            }}
          />
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Pipeline section (grouped by status)
// ---------------------------------------------------------------------------
function PipelineSection({
  title,
  customers,
  onOpen,
  defaultOpen = true,
}: {
  title: string;
  customers: CustomerRecord[];
  onOpen: (c: CustomerRecord) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (customers.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-3 flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
            {title}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-zinc-400">
            {customers.length}
          </span>
        </div>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-zinc-700 transition-transform",
            open && "rotate-90",
          )}
        />
      </button>
      {open && (
        <div className="space-y-2">
          {customers.map((c) => (
            <CustomerCard key={c.id} customer={c} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick add customer form (sidebar)
// ---------------------------------------------------------------------------
function QuickAddCard({ hasSubscription }: { hasSubscription: boolean }) {
  return (
    <Card className="bg-white/[0.035]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          Add customer
        </CardTitle>
        <CardDescription>Track a new outstanding balance.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasSubscription ? (
          <>
            <form action={createReminder} className="space-y-3">
              <input type="hidden" name="reminder_frequency_days" value="7" />
              <div>
                <Label htmlFor="qc_recipient_name" className="sr-only">
                  Customer name
                </Label>
                <Input
                  id="qc_recipient_name"
                  name="recipient_name"
                  placeholder="Customer name"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <Label htmlFor="qc_recipient_email" className="sr-only">
                  Customer email
                </Label>
                <Input
                  id="qc_recipient_email"
                  name="recipient_email"
                  type="email"
                  placeholder="customer@example.com"
                  maxLength={320}
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="w-[90px]">
                  <Label htmlFor="qc_currency" className="sr-only">Currency</Label>
                  <CurrencySelect id="qc_currency" name="currency" />
                </div>
                <Input
                  id="qc_amount_owed"
                  name="amount_owed"
                  inputMode="decimal"
                  placeholder="Amount owed"
                  required
                  className="flex-1"
                />
              </div>
              <Button type="submit" className="w-full">
                Add customer
              </Button>
            </form>
            <Link
              href="/reminders/new"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-400 hover:text-zinc-100"
            >
              Full form
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-zinc-500">
              Activate your plan to start tracking customers.
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

// ---------------------------------------------------------------------------
// Recent activity feed (sidebar)
// ---------------------------------------------------------------------------
function ActivityFeed({ customers }: { customers: CustomerRecord[] }) {
  type ActivityItem = {
    id: string;
    label: string;
    sub: string;
    at: string;
    tone: "success" | "warning" | "muted" | "primary";
  };

  const items: ActivityItem[] = customers
    .flatMap((c): ActivityItem[] => {
      const entries: ActivityItem[] = [];

      if (c.client_paid_at) {
        entries.push({
          id: `${c.id}-paid`,
          label: "Fully paid",
          sub: c.recipient_name,
          at: c.client_paid_at,
          tone: "success",
        });
      }
      if (c.promised_date) {
        entries.push({
          id: `${c.id}-promised`,
          label: "Payment promised",
          sub: `${c.recipient_name} · ${new Date(c.promised_date).toLocaleDateString()}`,
          at: c.updated_at,
          tone: "primary",
        });
      }
      if (c.last_sent_at) {
        entries.push({
          id: `${c.id}-sent`,
          label: "Reminder sent",
          sub: c.recipient_name,
          at: c.last_sent_at,
          tone: "muted",
        });
      }
      return entries;
    })
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 7);

  const dotColors = {
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    muted: "bg-zinc-600",
    primary: "bg-primary",
  };

  return (
    <Card className="bg-white/[0.025]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Recent activity
        </CardTitle>
        <CardDescription>Payments, promises, and follow-ups.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <span
                  className={cn(
                    "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                    dotColors[item.tone],
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">{item.sub}</p>
                  <p className="mt-0.5 text-xs text-zinc-700">
                    <LocalTime value={item.at} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center text-sm text-zinc-600">
            Activity will appear here as you log payments and follow-ups.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export function DashboardClient({
  customers,
  hasSubscription,
  isDevelopment,
}: {
  customers: CustomerRecord[];
  hasSubscription: boolean;
  isDevelopment: boolean;
}) {
  const [activeCustomer, setActiveCustomer] = useState<CustomerRecord | null>(null);

  // Pipeline groupings
  const overdue = customers.filter(
    (c) => c.workflow_status === "overdue" || getDaysOverdue(c) !== null && !isEffectivelyPaid(c),
  );
  const outstanding = customers.filter(
    (c) =>
      (c.workflow_status === "outstanding" || c.workflow_status === "partial") &&
      !isEffectivelyPaid(c) &&
      getDaysOverdue(c) === null,
  );
  const promised = customers.filter(
    (c) => c.workflow_status === "promised" && !isEffectivelyPaid(c),
  );
  const paid = customers.filter(isEffectivelyPaid);
  const writtenOff = customers.filter((c) => c.workflow_status === "written_off");

  // Stats
  const totalOutstanding = customers
    .filter((c) => !isEffectivelyPaid(c) && c.workflow_status !== "written_off")
    .reduce((sum, c) => sum + getRemainingBalance(c), 0);

  const currency = customers[0]?.currency ?? "USD";

  return (
    <>
      {/* Stats bar */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Total outstanding"
          value={customers.length > 0 ? formatCurrency(totalOutstanding, currency) : "—"}
          accent="indigo"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={String(overdue.length)}
          sub={overdue.length > 0 ? "Need attention" : "All on track"}
          accent="red"
        />
        <StatCard
          icon={Clock}
          label="Promised"
          value={String(promised.length)}
          sub={promised.length > 0 ? "Payment committed" : undefined}
          accent="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="Paid"
          value={String(paid.length)}
          accent="emerald"
        />
      </div>

      {/* Main layout */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Pipeline */}
        <section>
          {customers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-500">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-zinc-50">No customers yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                Add a customer to start tracking what they owe. You can log payments,
                record promises, and draft follow-ups from one place.
              </p>
              <div className="mt-6">
                <Link href={hasSubscription ? "/reminders/new" : "/settings/billing"}>
                  <Button>{hasSubscription ? "Add your first customer" : "Activate billing"}</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <PipelineSection
                title="Overdue"
                customers={overdue}
                onOpen={setActiveCustomer}
              />
              <PipelineSection
                title="Outstanding"
                customers={outstanding}
                onOpen={setActiveCustomer}
              />
              <PipelineSection
                title="Promised"
                customers={promised}
                onOpen={setActiveCustomer}
              />
              <PipelineSection
                title="Paid"
                customers={paid}
                onOpen={setActiveCustomer}
                defaultOpen={false}
              />
              {writtenOff.length > 0 && (
                <PipelineSection
                  title="Written off"
                  customers={writtenOff}
                  onOpen={setActiveCustomer}
                  defaultOpen={false}
                />
              )}
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-5">
          <QuickAddCard hasSubscription={hasSubscription} />
          <ActivityFeed customers={customers} />
        </aside>
      </div>

      {/* Drawer */}
      {activeCustomer && (
        <CustomerDrawer
          customer={activeCustomer}
          isDevelopment={isDevelopment}
          onClose={() => setActiveCustomer(null)}
        />
      )}
    </>
  );
}
