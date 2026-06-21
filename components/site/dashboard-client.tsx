"use client";

/*
 * DashboardClient — the interactive shell for the workflow-first dashboard.
 * Manages which customer's drawer is open; all data fetching stays in the
 * server page component (dashboard/page.tsx).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  ChevronRight,
  Plus,
  Zap,
  MessageSquare,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { LocalTime } from "@/components/site/local-time";
import { cn } from "@/lib/utils";
import type { CustomerRecord } from "@/lib/types";
import { getRemainingBalance, getDaysOverdue, isEffectivelyPaid } from "@/lib/types";
import Link from "next/link";

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
// Stats bar
// ---------------------------------------------------------------------------
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  tooltip,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: "red" | "amber" | "emerald" | "indigo";
  tooltip?: string;
}) {
  const iconColors = {
    red: "text-red-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    indigo: "text-indigo-400",
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white/[0.025] p-4 relative group">
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
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs text-zinc-600">{label}</p>
          {tooltip && (
            <div title={tooltip} className="cursor-help flex items-center justify-center">
              <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>
        {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Customer card (pipeline row)
// ---------------------------------------------------------------------------
type Tab = "payment" | "promise" | "followup" | "notes" | "automation";

function CustomerCard({
  customer,
  onOpen,
}: {
  customer: CustomerRecord;
  onOpen: (c: CustomerRecord, tab?: Tab) => void;
}) {
  const remaining = getRemainingBalance(customer);
  const daysOverdue = getDaysOverdue(customer);
  const status = customer.workflow_status;
  const paid = isEffectivelyPaid(customer);

  return (
    <div
      className={cn(
        "group w-full rounded-2xl border border-border bg-white/[0.025] transition-colors hover:border-white/20 hover:bg-white/[0.04]",
        paid && "opacity-60",
      )}
    >
      {/* Main clickable area */}
      <button
        type="button"
        onClick={() => onOpen(customer)}
        className="w-full p-4 text-left"
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

                {paid && (
                  <Badge variant={customer.client_paid_at ? "success" : "default"}>
                    {customer.client_paid_at ? "Customer marked paid" : "You marked paid"}
                  </Badge>
                )}
                {status === "partial" && !paid && (
                  <Badge variant="default">Partial</Badge>
                )}
                {daysOverdue !== null && !paid && (
                  <Badge variant="danger">{daysOverdue}d overdue</Badge>
                )}
                {customer.promised_date && !paid && (
                  <Badge variant="default">
                    Promised {new Date(customer.promised_date).toLocaleDateString()}
                  </Badge>
                )}
                {status === "promised" && !customer.promised_date && !paid && (
                  <Badge variant="default">Promised</Badge>
                )}
                {status === "written_off" && !paid && (
                  <Badge variant="muted">Written off</Badge>
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
                {formatCurrency(paid ? (Number(customer.amount_paid) || Number(customer.amount_owed)) : remaining, customer.currency)}
              </p>
              {customer.amount_paid > 0 && !paid && (
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


    </div>
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
  onOpen: (c: CustomerRecord, tab?: Tab) => void;
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
// Quick add customer card (sidebar)
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
      <CardContent className="space-y-3">
        {hasSubscription ? (
          <>
            <p className="text-sm leading-6 text-zinc-500">
              Enter their details, log payments, and set up automated reminders
              whenever you&apos;re ready.
            </p>
            <Link href="/invoices/new" className="block">
              <Button className="w-full gap-2">
                <Plus className="h-3.5 w-3.5" />
                Add customer
              </Button>
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm leading-6 text-zinc-500">
              Activate your plan to start tracking customers.
            </p>
            <Link href="/settings/billing" className="block">
              <Button className="w-full">Open billing</Button>
            </Link>
          </>
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
          label: "Paid — customer confirmed",
          sub: c.recipient_name,
          at: c.client_paid_at,
          tone: "success",
        });
      } else if (c.workflow_status === "paid") {
        entries.push({
          id: `${c.id}-paid`,
          label: "Marked as paid",
          sub: c.recipient_name,
          at: c.updated_at,
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
  currency = "USD",
}: {
  customers: CustomerRecord[];
  hasSubscription: boolean;
  isDevelopment?: boolean;
  currency?: string;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("payment");
  const router = useRouter();

  function handleOpen(customer: CustomerRecord, tab: Tab = "payment") {
    router.push(`/invoices/${customer.id}?tab=${tab}`);
  }

  // Pipeline groupings — simplified: overdue / outstanding / paid / opted out
  const overdue = customers.filter(
    (c) => getDaysOverdue(c) !== null && !isEffectivelyPaid(c),
  );
  const outstanding = customers.filter(
    (c) => !isEffectivelyPaid(c) && getDaysOverdue(c) === null,
  );
  const paid = customers.filter((c) => isEffectivelyPaid(c));
  const optedOut: CustomerRecord[] = [];

  // Stats
  const totalOutstanding = customers
    .filter((c) => !isEffectivelyPaid(c) && c.workflow_status !== "written_off")
    .reduce((sum, c) => sum + getRemainingBalance(c), 0);

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
          icon={CheckCircle2}
          label="Paid"
          value={String(paid.length)}
          accent="emerald"
        />
        <StatCard
          icon={Users}
          label="Opted out"
          value={String(optedOut.length)}
          sub={optedOut.length > 0 ? "Unsubscribed" : undefined}
          accent="amber"
        />
      </div>

        {/* Main layout */}
      <div className="grid gap-5">
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
                <Link href={hasSubscription ? "/invoices/new" : "/settings/billing"}>
                  <Button>{hasSubscription ? "Add your first customer" : "Activate billing"}</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <PipelineSection
                title="Overdue"
                customers={overdue}
                onOpen={handleOpen}
              />
              <PipelineSection
                title="Outstanding"
                customers={outstanding}
                onOpen={handleOpen}
              />
              <PipelineSection
                title="Paid"
                customers={paid}
                onOpen={handleOpen}
                defaultOpen={false}
              />
              {optedOut.length > 0 && (
                <PipelineSection
                  title="Opted out"
                  customers={optedOut}
                  onOpen={handleOpen}
                  defaultOpen={false}
                />
              )}
            </div>
          )}
        </section>
      </div>

    </>
  );
}
