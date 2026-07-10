"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, AlertCircle, ArrowRight, Activity, Percent, Send, Info, FileText } from "lucide-react";
import { getDaysOverdue, isEffectivelyPaid, CustomerRecord, CustomerEvent } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { CollectionTrendWidget, DashboardPipelineWidget } from "@/components/site/dashboard-widgets";
import { CurrencySelector } from "@/components/site/currency-selector";

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function DashboardUI({
  customers,
  events,
  recentEvents,
  uniqueCurrencies,
  selectedCurrency,
}: {
  customers: CustomerRecord[];
  events: CustomerEvent[];
  recentEvents: (CustomerEvent & { clients?: { name?: string }, invoices?: { clients?: { name?: string } } })[];
  uniqueCurrencies: string[];
  selectedCurrency: string;
}) {
  let totalCollected = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;

  for (const c of customers) {
    const paid = Number(c.amount_paid) || 0;
    const owed = Number(c.amount_owed) || 0;
    const remaining = Math.max(0, owed - paid);

    totalCollected += paid;
    totalOutstanding += remaining;

    const daysOverdue = getDaysOverdue(c);
    if (daysOverdue && remaining > 0 && !isEffectivelyPaid(c)) {
      totalOverdue += remaining;
    }
  }

  const collectionRate = (totalCollected + totalOutstanding) > 0 
    ? (totalCollected / (totalCollected + totalOutstanding)) * 100 
    : 0;

  const actionNeededMap = new Map<string, { id: string; name: string; remaining: number; daysOverdue: number; currency: string }>();
  for (const c of customers) {
    if (isEffectivelyPaid(c)) continue;
    const daysOverdue = getDaysOverdue(c) || 0;
    if (daysOverdue <= 0) continue; // ONLY overdue invoices

    const remaining = Math.max(0, Number(c.amount_owed) - Number(c.amount_paid));
    if (remaining <= 0) continue;

    const name = c.clients?.name || "Unknown";
    const existing = actionNeededMap.get(name);
    if (existing) {
      existing.remaining += remaining;
      existing.daysOverdue = Math.max(existing.daysOverdue, daysOverdue);
    } else {
      actionNeededMap.set(name, {
        id: c.client_id || c.customer_id || c.id,
        name,
        remaining,
        daysOverdue,
        currency: c.currency || "USD"
      });
    }
  }

  const actionNeeded = Array.from(actionNeededMap.values())
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, 5);

  const overdueAll = customers.filter(c => getDaysOverdue(c) !== null && !isEffectivelyPaid(c));
  const outstandingAll = customers.filter(c => getDaysOverdue(c) === null && !isEffectivelyPaid(c));
  const paidAll = customers.filter(c => isEffectivelyPaid(c));

  const pipelines = {
    overdue: { invoices: overdueAll.slice(0, 10), count: overdueAll.length },
    outstanding: { invoices: outstandingAll.slice(0, 10), count: outstandingAll.length },
    paid: { invoices: paidAll.slice(0, 10), count: paidAll.length }
  };

  const totals = {
    overdue: overdueAll.length,
    outstanding: outstandingAll.length,
    paid: paidAll.length
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
            Overview
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
            A high-level look at your receivables and collections performance.
          </p>
        </div>
        <CurrencySelector currencies={uniqueCurrencies} selected={selectedCurrency} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-white/[0.025] border-white/10 relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{formatCurrency(totalCollected, selectedCurrency)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.025] border-white/10 group relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Outstanding</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{formatCurrency(totalOutstanding, selectedCurrency)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.025] border-white/10 group relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Collection Rate</CardTitle>
            <Percent className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{collectionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.025] border-white/10 group relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help" title="The total amount of money from invoices that are past their due date.">
              Overdue Risk
              <Info className="h-3.5 w-3.5 text-zinc-600" />
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{formatCurrency(totalOverdue, selectedCurrency)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr] mb-8">
        <DashboardPipelineWidget pipelines={pipelines as any} totals={totals as any} currency={selectedCurrency} />
        <CollectionTrendWidget events={events} currency={selectedCurrency} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Customers Overview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 flex items-center gap-2">
              <Users className="h-5 w-5 text-zinc-400" /> Customers Action Needed
            </h2>
            <Link href="/customers" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {actionNeeded.length > 0 ? (
            <div className="space-y-3">
              {actionNeeded.map((customer) => {
                return (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.025] hover:bg-white/[0.05] transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-zinc-200">{customer.name}</h3>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        <span className="text-red-400">{customer.daysOverdue} days overdue</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-zinc-200">{formatCurrency(customer.remaining, customer.currency)}</div>
                      <div className="text-sm text-zinc-500 mt-0.5">Remaining</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center h-[300px] flex flex-col justify-center">
              <Users className="mx-auto h-8 w-8 text-zinc-500 mb-3" />
              <h3 className="text-sm font-medium text-zinc-200">You&apos;re all caught up</h3>
              <p className="text-sm text-zinc-500 mt-1">No customers currently need your attention.</p>
            </div>
          )}
        </div>

        {/* Activity Overview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50 flex items-center gap-2">
              <Activity className="h-5 w-5 text-zinc-400" /> Recent Activity
            </h2>
            <Link href="/activity" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.map((event) => {
                const isPayment = event.event_type === "payment";
                const customerName = event.clients?.name || event.invoices?.clients?.name || "Unknown Customer";
                
                return (
                  <Link
                    key={event.id}
                    href={`/customers/${event.customer_id}`}
                    className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.025] hover:bg-white/[0.05] transition-colors"
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${isPayment ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-blue-500/20 bg-blue-500/10 text-blue-500"}`}>
                      {isPayment ? <DollarSign className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-zinc-200">
                          {isPayment ? "Payment Logged" : "Follow-up Sent"}
                        </p>
                        <time className="text-xs text-zinc-500">
                          {formatDistanceToNow(new Date(event.event_date || event.created_at), { addSuffix: true })}
                        </time>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {isPayment 
                          ? `Recorded ${formatCurrency(Number(event.amount), event.currency || "USD")} from ${customerName}`
                          : `Sent an automated follow-up to ${customerName}`
                        }
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center h-[300px] flex flex-col justify-center">
              <Activity className="mx-auto h-8 w-8 text-zinc-500 mb-3" />
              <h3 className="text-sm font-medium text-zinc-200">No recent activity</h3>
              <p className="text-sm text-zinc-500 mt-1">Your recent payments and follow-ups will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
