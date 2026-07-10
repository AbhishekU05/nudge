/* eslint-disable */
"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerEvent, CustomerRecord, getDaysOverdue } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AlertCircle, Calendar, ArrowRight } from "lucide-react";

function CustomTooltip({ active, payload, label, currency = "USD" }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-zinc-900 p-3 shadow-xl">
        <p className="mb-1 text-sm font-medium text-zinc-300">{label}</p>
        <p className="text-sm font-bold text-emerald-400">
          {new Intl.NumberFormat(undefined, {
            currency,
            style: "currency",
            maximumFractionDigits: 0,
          }).format(Number(payload[0].value))}
        </p>
      </div>
    );
  }
  return null;
}

export function CollectionTrendWidget({ events, data: monthlyData, currency = "USD" }: { events?: CustomerEvent[], data?: { month: string; amount: number }[], currency?: string }) {
  const now = new Date();
  const monthlyTotals: Record<string, number> = {};

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    monthlyTotals[monthLabel] = 0;
  }

  if (monthlyData) {
    // Server-aggregated totals labeled 'Mon YYYY' — matches the scaffold labels above
    monthlyData.forEach(({ month, amount }) => {
      if (monthlyTotals[month] !== undefined) {
        monthlyTotals[month] = Number(amount) || 0;
      }
    });
  } else {
    (events || []).forEach((event) => {
      if (event.event_type === "payment" && event.amount) {
        const d = new Date(event.event_date || event.created_at);
        const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        if (monthlyTotals[monthLabel] !== undefined) {
          monthlyTotals[monthLabel] += Number(event.amount);
        }
      }
    });
  }

  const data = Object.entries(monthlyTotals).map(([month, amount]) => ({
    month: month.split(" ")[0],
    amount,
  }));

  return (
    <Card className="bg-white/[0.025] border-white/10 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-zinc-100">Collection Trends</CardTitle>
        <CardDescription>Monthly revenue collected over the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-6">
        <div className="h-full min-h-[250px] w-full">
          {data.some((d) => d.amount > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmountDashboard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => new Intl.NumberFormat(undefined, { currency, style: "currency", maximumFractionDigits: 0 }).format(v)} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAmountDashboard)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-600">
              No payment data available yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { WorkflowStatus } from "@/lib/types";

const COLUMNS: { id: WorkflowStatus; title: string; color: string }[] = [
  { id: "outstanding", title: "Outstanding", color: "border-blue-500/20 bg-blue-500/10 text-blue-400" },
  { id: "overdue", title: "Overdue", color: "border-red-500/20 bg-red-500/10 text-red-400" },
  { id: "paid", title: "Paid In Full", color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
];

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function DashboardPipelineWidget({ 
  pipelines, 
  totals,
  currency = "USD" 
}: { 
  pipelines: {
    overdue: { invoices: CustomerRecord[], count: number },
    outstanding: { invoices: CustomerRecord[], count: number },
    paid: { invoices: CustomerRecord[], count: number }
  },
  totals: { overdue: number, outstanding: number, paid: number },
  currency?: string 
}) {
  const columns = [
    { id: 'outstanding', title: 'Outstanding', color: 'border-blue-500/20 bg-blue-500/10 text-blue-400' },
    { id: 'overdue', title: 'Overdue', color: 'border-red-500/20 bg-red-500/10 text-red-400' },
    { id: 'paid', title: 'Paid In Full', color: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' },
  ];

  return (
    <Card className="bg-white/[0.025] border-white/10 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-zinc-100">Pipeline Snapshot</CardTitle>
          <CardDescription>Top customers by status.</CardDescription>
        </div>
        <Link href="/pipeline" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 overflow-x-auto pb-6">
        <div className="flex gap-4 h-full min-w-[700px]">
          {columns.map(column => {
            const colData = pipelines[column.id as keyof typeof pipelines];
            const colTotal = totals[column.id as keyof typeof totals];

            return (
              <div key={column.id} className="flex-1 min-w-[250px] bg-white/[0.01] rounded-xl border border-white/5 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border", column.color)}>
                      {column.title}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">{colData.count}</span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-300">{formatCurrency(colTotal, currency)}</p>
                </div>
                
                <div className="p-2 space-y-2">
                  {colData.invoices.slice(0, 3).map((customer) => {
                    const remaining = Math.max(0, Number(customer.amount_owed) - Number(customer.amount_paid));
                    const displayAmount = column.id === 'paid' ? Number(customer.amount_paid) || Number(customer.amount_owed) : remaining;
                    const daysOverdue = getDaysOverdue(customer);

                    return (
                      <Card key={customer.id} className="bg-[#1c1c1e] border-white/10 p-3 rounded-lg shadow-sm">
                        <Link href={`/invoices/${customer.id}`} className="block">
                          <div className="flex justify-between items-start mb-1.5">
                            <h4 className="font-medium text-zinc-200 text-xs line-clamp-1">{customer.recipient_name}</h4>
                            <span className="font-semibold text-zinc-100 text-xs">{formatCurrency(displayAmount, currency)}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-2">
                            {customer.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-2.5 w-2.5" />
                                {new Date(customer.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                            {daysOverdue !== null && daysOverdue > 0 && column.id !== 'paid' && (
                              <div className="flex items-center gap-1 text-red-400">
                                <AlertCircle className="h-2.5 w-2.5" />
                                {daysOverdue}d late
                              </div>
                            )}
                          </div>
                        </Link>
                      </Card>
                    );
                  })}
                  {colData.count > 3 && (
                    <div className="text-center pt-1">
                      <span className="text-[10px] text-zinc-500">+{colData.count - Math.min(colData.invoices.length, 3)} more</span>
                    </div>
                  )}
                  {colData.count === 0 && (
                    <div className="text-center py-4 text-xs text-zinc-600">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
