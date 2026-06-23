import Link from "next/link";
import { Container } from "@/components/site/container";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, AlertCircle, ArrowRight, Activity, Percent, Clock, Send, Info, Mail, Zap, FileText } from "lucide-react";
import { getDaysOverdue, type CustomerRecord } from "@/lib/types";
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
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [customersRes, eventsRes, draftsRes, activeClientsRes, activeInvoicesRes] = await Promise.all([
    supabase.from("invoices").select("*").eq("user_id", user.id),
    supabase.from("customer_events").select("*, clients(name), invoices(recipient_name)").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("email_drafts").select("*").eq("user_id", user.id).eq("status", "draft").order("created_at", { ascending: false }).limit(5),
    supabase.from("clients").select("id, name, next_send_at").eq("user_id", user.id).eq("active", true).order("next_send_at", { ascending: true }).limit(5),
    supabase.from("invoices").select("id, recipient_name, next_send_at").eq("user_id", user.id).eq("active", true).order("next_send_at", { ascending: true }).limit(5)
  ]);

  const allCustomers = (customersRes.data || []) as CustomerRecord[];
  
  // Handle currencies
  const uniqueCurrencies = Array.from(new Set(allCustomers.map(c => c.currency || 'USD'))).sort();
  const selectedCurrency = searchParams?.currency || (uniqueCurrencies.includes('USD') ? 'USD' : uniqueCurrencies[0] || 'USD');
  const customers = allCustomers.filter(c => (c.currency || 'USD') === selectedCurrency);

  const events = (eventsRes.data || []).filter((e: any) => !e.currency || e.currency === selectedCurrency);
  const recentEvents = events.slice(0, 5);

  const pendingDrafts = draftsRes.data || [];
  const activeAutomations = [
    ...(activeClientsRes.data || []).map(c => ({ id: c.id, name: c.name, next_send_at: c.next_send_at, type: 'client' })),
    ...(activeInvoicesRes.data || []).map(i => ({ id: i.id, name: i.recipient_name, next_send_at: i.next_send_at, type: 'invoice' }))
  ].sort((a, b) => new Date(a.next_send_at).getTime() - new Date(b.next_send_at).getTime()).slice(0, 5);

  const recentInvoices = [...customers].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

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
                          <h3 className="font-medium text-zinc-200">{customer.recipient_name}</h3>
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
                    const customerName = event.clients?.name || event.invoices?.recipient_name || "Unknown Customer";
                    
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
                        <h3 className="font-medium text-zinc-200 truncate">{inv.recipient_name}</h3>
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
                  {pendingDrafts.map((draft: any) => (
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
                  ))}
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
                  {activeAutomations.map((auto: any) => (
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
                  ))}
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
