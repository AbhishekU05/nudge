"use client";

/*
 * DashboardClient — the interactive shell for the workflow-first dashboard.
 * Manages which customer's drawer is open; all data fetching stays in the
 * server page component (dashboard/page.tsx).
 */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";



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
  totalCount,
  currentPage,
  pageSize,
  prevHref,
  nextHref,
  onOpen,
  defaultOpen = true,
}: {
  title: string;
  customers: CustomerRecord[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  prevHref: string;
  nextHref: string;
  onOpen: (c: CustomerRecord, tab?: Tab) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (totalCount === 0) return null;

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
            {totalCount}
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
          {customers.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-600">No invoices on this page.</div>
          ) : (
            customers.map((c) => (
              <CustomerCard key={c.id} customer={c} onOpen={onOpen} />
            ))
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-600">
                Page {currentPage} of {totalPages} · {totalCount} {title.toLowerCase()} invoices
              </span>
              <div className="flex items-center gap-2">
                <Link href={prevHref}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage <= 1}
                    className="h-8 border border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                  </Button>
                </Link>
                <Link href={nextHref}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    className="h-8 border border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export function DashboardClient({
  pipelines,
  totals,
  hasSubscription,
  pages,
  pageSize,
}: {
  pipelines: {
    overdue: CustomerRecord[];
    outstanding: CustomerRecord[];
    paid: CustomerRecord[];
  };
  totals: {
    outstandingAmount: number;
    overdueCount: number;
    outstandingCount: number;
    paidCount: number;
    optedOutCount: number;
  };
  hasSubscription: boolean;
  pages: { overdue: number; outstanding: number; paid: number };
  pageSize: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleOpen(customer: CustomerRecord, tab: Tab = "payment") {
    router.push(`/invoices/${customer.id}?tab=${tab}`);
  }

  // Each bucket's Prev/Next only changes its own page param — every other
  // param (currency, groupId, the other buckets' pages) survives untouched.
  function pageHref(param: "overduePage" | "outstandingPage" | "paidPage", page: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set(param, String(Math.max(1, page)));
    return `/invoices?${next.toString()}`;
  }

  const { overdue, outstanding, paid } = pipelines;
  const optedOut: CustomerRecord[] = [];
  const totalCustomers = totals.overdueCount + totals.outstandingCount + totals.paidCount;

  return (
    <>
      <div className="grid gap-5">
        {/* Pipeline */}
        <section>
          {totalCustomers === 0 ? (
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
                totalCount={totals.overdueCount}
                currentPage={pages.overdue}
                pageSize={pageSize}
                prevHref={pageHref("overduePage", pages.overdue - 1)}
                nextHref={pageHref("overduePage", pages.overdue + 1)}
                onOpen={handleOpen}
              />
              <PipelineSection
                title="Outstanding"
                customers={outstanding}
                totalCount={totals.outstandingCount}
                currentPage={pages.outstanding}
                pageSize={pageSize}
                prevHref={pageHref("outstandingPage", pages.outstanding - 1)}
                nextHref={pageHref("outstandingPage", pages.outstanding + 1)}
                onOpen={handleOpen}
              />
              <PipelineSection
                title="Paid"
                customers={paid}
                totalCount={totals.paidCount}
                currentPage={pages.paid}
                pageSize={pageSize}
                prevHref={pageHref("paidPage", pages.paid - 1)}
                nextHref={pageHref("paidPage", pages.paid + 1)}
                onOpen={handleOpen}
                defaultOpen={false}
              />
              {totals.optedOutCount > 0 && (
                <PipelineSection
                  title="Opted out"
                  customers={optedOut}
                  totalCount={totals.optedOutCount}
                  currentPage={1}
                  pageSize={pageSize}
                  prevHref="/invoices"
                  nextHref="/invoices"
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
