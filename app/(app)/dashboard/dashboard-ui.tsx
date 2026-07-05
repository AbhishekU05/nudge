"use client";

import Link from "next/link";
import { Container } from "@/components/site/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, AlertCircle, ArrowRight, Activity, Percent, Clock, Send, Info, Mail, Zap, FileText } from "lucide-react";
import { getDaysOverdue, CustomerRecord, CustomerEvent } from "@/lib/types";
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
  recentInvoices,
  activeAutomations,
  pendingDrafts,
  uniqueCurrencies,
  selectedCurrency,
}: {
  customers: CustomerRecord[];
  events: CustomerEvent[];
  recentEvents: any[];
  recentInvoices: any[];
  activeAutomations: any[];
  pendingDrafts: any[];
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
    if (daysOverdue && remaining > 0 && !c.client_paid_at) {
      totalOverdue += remaining;
    }
  }

  const collectionRate = (totalCollected + totalOutstanding) > 0 
    ? (totalCollected / (totalCollected + totalOutstanding)) * 100 
    : 0;

  // Get top 5 overdue/outstanding customers
  const actionNeeded = customers
    .filter((c) => {
      const remaining = Math.max(0, Number(c.amount_owed) - Number(c.amount_paid));
      return remaining > 0 && !c.client_paid_at;
    })
    .sort((a, b) => {
      const aOverdue = getDaysOverdue(a) || 0;
      const bOverdue = getDaysOverdue(b) || 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue; // Most overdue first
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })
    .slice(0, 5);

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
        <DashboardPipelineWidget customers={customers} currency={selectedCurrency} />
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
                const remaining = Math.max(0, Number(customer.amount_owed) - Number(customer.amount_paid));
                const daysOverdue = getDaysOverdue(customer);
                return (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.025] hover:bg-white/[0.05] transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-zinc-200">{customer.clients?.name || "Unknown"}</h3>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        {daysOverdue ? <span className="text-red-400">{daysOverdue} days overdue</span> : "Outstanding"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-zinc-200">{formatCurrency(remaining, customer.currency)}</div>
                      <div className="text-sm text-zinc-500 mt-0.5">Remaining</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center h-[300px] flex flex-col justify-center">
              <Users className="mx-auto h-8 w-8 text-zinc-500 mb-3" />
              <h3 className="text-sm font-medium text-zinc-200">You're all caught up</h3>
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
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </time>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {isPayment 
                          ? `Recorded ${formatCurrency(Number(event.amount), event.currency)} from ${customerName}`
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
