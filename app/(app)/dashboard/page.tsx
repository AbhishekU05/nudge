import Link from "next/link";
import { Container } from "@/components/site/container";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, AlertCircle, ArrowRight, Activity, Percent, Clock, Send, Info, Mail, Zap, FileText } from "lucide-react";
import { getDaysOverdue, isEffectivelyPaid, type CustomerRecord, type CustomerEvent } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

import { CollectionTrendWidget, DashboardPipelineWidget } from "@/components/site/dashboard-widgets";
import { DashboardBackgroundSync } from "@/components/site/dashboard-background-sync";
import { CurrencySelector } from "@/components/site/currency-selector";

export default async function DashboardPage(props: {
  searchParams?: Promise<{ currency?: string }>;
}) {
  const searchParams = await props.searchParams;
  await requireUser();
  const supabase = await createSupabaseServerClient();

  // Distinct currencies (RLS-scoped, aggregated in Postgres) drive the selector
  // and the default: USD if the org has USD invoices, otherwise its first currency.
  const { data: currencyData } = await supabase.rpc("get_invoice_currencies");
  const uniqueCurrencies = Array.from(
    new Set([...((currencyData as string[] | null) || []), "USD"])
  ).sort();
  const orgCurrencies = (currencyData as string[] | null) || [];
  const defaultCurrency = orgCurrencies.includes("USD") ? "USD" : orgCurrencies[0] || "USD";
  const selectedCurrency = searchParams?.currency || defaultCurrency;

  const { data: rpcData, error: rpcError } = await supabase.rpc("get_dashboard_pipeline", {
    p_currency: selectedCurrency,
  });

  if (rpcError) console.error("Dashboard RPC error:", rpcError);

  interface RecentEventRow {
    id: string;
    invoice_id: string | null;
    event_type: string;
    created_at: string;
    note: string | null;
    client_name: string | null;
    amount: number | null;
  }
  interface DashboardPipelineData {
    pipelines?: Record<"overdue" | "outstanding" | "paid", { rows: CustomerRecord[]; count: number }>;
    totals?: {
      totalCollected: number;
      totalOutstanding: number;
      totalOverdue: number;
      overdueCount: number;
      outstandingCount: number;
      paidCount: number;
      collectionRate: number;
    };
    actionNeeded?: { id: string; name: string; remaining: number; daysOverdue: number; currency: string }[];
    recentEvents?: RecentEventRow[];
    recentInvoices?: CustomerRecord[];
    monthlyCollections?: { month: string; amount: number }[];
  }
  const d = (rpcData || null) as DashboardPipelineData | null;

  const pipelines = {
    overdue:      { invoices: (d?.pipelines?.overdue?.rows      || []) as CustomerRecord[], count: d?.pipelines?.overdue?.count      || 0 },
    outstanding:  { invoices: (d?.pipelines?.outstanding?.rows  || []) as CustomerRecord[], count: d?.pipelines?.outstanding?.count  || 0 },
    paid:         { invoices: (d?.pipelines?.paid?.rows         || []) as CustomerRecord[], count: d?.pipelines?.paid?.count         || 0 },
  };

  const totalCollected   = Number(d?.totals?.totalCollected   || 0);
  const totalOutstanding = Number(d?.totals?.totalOutstanding || 0);
  const totalOverdue     = Number(d?.totals?.totalOverdue     || 0);
  const collectionRate   = Number(d?.totals?.collectionRate   || 0);

  // Per-column money totals for the pipeline widget
  const pipelineTotals = {
    overdue: totalOverdue,
    outstanding: totalOutstanding,
    paid: totalCollected,
  };

  const actionNeeded: { id: string; name: string; remaining: number; daysOverdue: number; currency: string }[] =
    d?.actionNeeded || [];

  const recentEvents = (d?.recentEvents || []).map((e) => ({
    id: e.id,
    invoice_id: e.invoice_id,
    customer_id: e.invoice_id,
    event_type: e.event_type,
    event_date: e.created_at,
    created_at: e.created_at,
    amount: e.amount,
    followup_method: null as string | null,
    note: e.note,
    clients: { name: e.client_name ?? undefined },
  }));

  const recentInvoices: CustomerRecord[] = d?.recentInvoices || [];

  const collectionTrend: { month: string; amount: number }[] = d?.monthlyCollections || [];
  const pendingDrafts: { id: string; subject?: string; to_email?: string }[] = [];
  const activeAutomations: { id: string; type: string; name?: string; next_send_at?: string }[] = [];


  return (
    <div className="flex min-h-screen flex-col">
      <DashboardBackgroundSync />
      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
                Overview
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
                A high-level summary of your business across all areas.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <CurrencySelector currencies={uniqueCurrencies} selected={selectedCurrency} />
              <Link href="/analytics" className="hidden sm:flex items-center gap-2 rounded-lg bg-white/[0.05] px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-white/[0.1] transition-colors border border-white/10">
                <Activity className="h-4 w-4" />
                Full Analytics
              </Link>
            </div>
          </div>

          {/* Analytics Overview */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card className="bg-white/[0.025] border-white/10 group relative">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help" title="The total amount of money currently owed by your customers.">
                  Total Outstanding
                  <Info className="h-3.5 w-3.5 text-zinc-600" />
                </CardTitle>
                <DollarSign className="h-4 w-4 text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-50">{formatCurrency(totalOutstanding, selectedCurrency)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white/[0.025] border-white/10 group relative">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help" title="The total amount of money you have successfully collected.">
                  Total Collected
                  <Info className="h-3.5 w-3.5 text-zinc-600" />
                </CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-50">{formatCurrency(totalCollected, selectedCurrency)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white/[0.025] border-white/10 group relative">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help" title="The percentage of total billed amount that has been collected.">
                  Collection Rate
                  <Info className="h-3.5 w-3.5 text-zinc-600" />
                </CardTitle>
                <Percent className="h-4 w-4 text-blue-500" />
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
            <DashboardPipelineWidget pipelines={pipelines} totals={pipelineTotals} currency={selectedCurrency} />
            <CollectionTrendWidget data={collectionTrend} currency={selectedCurrency} />
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
                    const ev = event as CustomerEvent & { clients?: { name?: string }, invoices?: { clients?: { name?: string } } };
                    const customerName = ev.clients?.name || ev.invoices?.clients?.name || "Unknown Customer";
                    
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
                          <p className="text-sm text-zinc-400 line-clamp-1">
                            {isPayment ? (
                              <>Recorded <span className="text-zinc-300 font-medium">{formatCurrency(event.amount || 0, selectedCurrency)}</span> from {customerName}</>
                            ) : (
                              <>Contacted {customerName} via {event.followup_method || "email"}</>
                            )}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center h-[300px] flex flex-col justify-center">
                  <Clock className="mx-auto h-8 w-8 text-zinc-500 mb-3" />
                  <h3 className="text-sm font-medium text-zinc-200">No activity yet</h3>
                  <p className="text-sm text-zinc-500 mt-1 max-w-[200px] mx-auto">Your timeline will populate once you start logging payments and sending follow-ups.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 mt-8">
            {/* Recent Invoices */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold tracking-tight text-zinc-50 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-zinc-400" /> Recent Invoices
                </h2>
                <Link href="/invoices" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {recentInvoices.length > 0 ? (
                <div className="space-y-3">
                  {recentInvoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.025] hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="min-w-0">
                        <h3 className="font-medium text-zinc-200 truncate">{inv.recipient_name || "Unknown"}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="font-medium text-zinc-200">{formatCurrency(Number(inv.amount_owed) || 0, inv.currency || selectedCurrency)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center flex flex-col justify-center h-[200px]">
                  <p className="text-sm text-zinc-500">No invoices yet.</p>
                </div>
              )}
            </div>

            {/* Pending Queue */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold tracking-tight text-zinc-50 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-zinc-400" /> Pending Queue
                </h2>
                <Link href="/automate" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors">
                  View queue <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {pendingDrafts.length > 0 ? (
                <div className="space-y-3">
                  {pendingDrafts.map((draftRaw) => {
                    const draft = draftRaw as { id: string; subject?: string; to_email?: string };
                    return (
                    <Link
                      key={draft.id}
                      href={`/drafts`}
                      className="flex flex-col p-4 rounded-xl border border-white/10 bg-white/[0.025] hover:bg-white/[0.05] transition-colors"
                    >
                      <h3 className="font-medium text-zinc-200 truncate">{draft.subject}</h3>
                      <p className="text-xs text-zinc-500 mt-1 truncate">
                        To: {draft.to_email}
                      </p>
                    </Link>
                  )})}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center flex flex-col justify-center h-[200px]">
                  <p className="text-sm text-zinc-500">Queue is empty.</p>
                </div>
              )}
            </div>

            {/* Active Automations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold tracking-tight text-zinc-50 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-zinc-400" /> Active Automations
                </h2>
                <Link href="/automate" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors">
                  Manage settings <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {activeAutomations.length > 0 ? (
                <div className="space-y-3">
                  {activeAutomations.map((autoRaw) => {
                    const auto = autoRaw as { id: string; type: string; name?: string; next_send_at?: string };
                    return (
                    <Link
                      key={`${auto.type}-${auto.id}`}
                      href={`/customers/${auto.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.025] hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="min-w-0">
                        <h3 className="font-medium text-zinc-200 truncate">{auto.name || "Unknown"}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5 capitalize">
                          {auto.type} Automation
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-xs text-zinc-400">Next Send</div>
                        <div className="text-sm font-medium text-zinc-200">
                          {auto.next_send_at ? formatDistanceToNow(new Date(auto.next_send_at), { addSuffix: true }) : "N/A"}
                        </div>
                      </div>
                    </Link>
                  )})}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center flex flex-col justify-center h-[200px]">
                  <p className="text-sm text-zinc-500">No active automations.</p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
