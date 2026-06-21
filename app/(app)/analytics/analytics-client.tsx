"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, AlertCircle, Clock } from "lucide-react";
import { getDaysOverdue, type CustomerRecord, type CustomerEvent } from "@/lib/types";
import { format } from "date-fns";

const COLORS = ["#10b981", "#3b82f6", "#ef4444", "#f59e0b"];

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function AnalyticsClient({
  customers,
  events,
}: {
  customers: CustomerRecord[];
  events: CustomerEvent[];
}) {
  const stats = useMemo(() => {
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueCount = 0;
    let paidCount = 0;
    let outstandingCount = 0;
    let totalDaysOverdue = 0;

    const offenders: { name: string; amount: number; days: number }[] = [];

    // Aging Buckets
    const agingBuckets = {
      "1-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0,
    };

    // Monthly Follow-ups
    const followupsByMonth: Record<string, number> = {};

    // New Metrics variables
    let totalDaysToPayment = 0;
    let paidCustomersWithDates = 0;

    let customersWithPromises = new Set<string>();
    let customersWithPromisesKept = new Set<string>();

    let followupsBeforePaymentCount = 0;
    let customersWithFollowupsAndPaid = 0;

    let revenueThisMonth = 0;
    let revenueLastMonth = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    customers.forEach((c) => {
      const paid = Number(c.amount_paid) || 0;
      const owed = Number(c.amount_owed) || 0;
      const remaining = Math.max(0, owed - paid);
      
      totalCollected += paid;
      totalOutstanding += remaining;

      const isPaid = remaining <= 0 || c.client_paid_at;
      const daysOverdue = getDaysOverdue(c);

      // Best/Worst Tracking & Days to Payment
      if (isPaid && c.client_paid_at && c.due_date) {
        paidCustomersWithDates++;
        const invDate = new Date(c.due_date);
        const paidDate = new Date(c.client_paid_at);
        const diffTime = Math.abs(paidDate.getTime() - invDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDaysToPayment += diffDays;
      }

      if (isPaid) {
        paidCount++;
      } else if (daysOverdue && daysOverdue > 0) {
        overdueCount++;
        totalOverdue += remaining;
        totalDaysOverdue += daysOverdue;
        offenders.push({
          name: c.recipient_name || "Unknown",
          amount: remaining,
          days: daysOverdue,
        });

        // Add to aging bucket
        if (daysOverdue <= 30) agingBuckets["1-30"] += remaining;
        else if (daysOverdue <= 60) agingBuckets["31-60"] += remaining;
        else if (daysOverdue <= 90) agingBuckets["61-90"] += remaining;
        else agingBuckets["90+"] += remaining;

      } else {
        outstandingCount++;
      }
    });

    const avgDaysOverdue = overdueCount > 0 ? Math.round(totalDaysOverdue / overdueCount) : 0;
    const avgDaysToPayment = paidCustomersWithDates > 0 ? Math.round(totalDaysToPayment / paidCustomersWithDates) : 0;
    const collectionRate = (totalCollected + totalOutstanding) > 0 ? (totalCollected / (totalCollected + totalOutstanding)) * 100 : 0;
    
    // Sort offenders by amount
    const topOffenders = offenders.sort((a, b) => b.amount - a.amount).slice(0, 5);
    const worstClients = [...offenders].sort((a, b) => b.days - a.days).slice(0, 3); // Highest days overdue

    // Event Loop for Advanced Metrics
    const collectionsByMonth: Record<string, number> = {};
    
    // Map of customer_id to number of followups
    const followupsPerCustomer: Record<string, number> = {};

    events.forEach(e => {
      const date = new Date(e.created_at);
      const monthKey = format(date, "MMM yyyy");
      
      const eMonth = date.getMonth();
      const eYear = date.getFullYear();

      if (e.event_type === "payment" && e.amount) {
        collectionsByMonth[monthKey] = (collectionsByMonth[monthKey] || 0) + Number(e.amount);
        
        if (eMonth === currentMonth && eYear === currentYear) {
          revenueThisMonth += Number(e.amount);
        } else if (eMonth === lastMonth && eYear === lastMonthYear) {
          revenueLastMonth += Number(e.amount);
        }

        // If they paid, record how many followups it took
        if (followupsPerCustomer[e.customer_id] > 0) {
          customersWithFollowupsAndPaid++;
          followupsBeforePaymentCount += followupsPerCustomer[e.customer_id];
        }
        
        // Promise kept?
        if (customersWithPromises.has(e.customer_id)) {
          customersWithPromisesKept.add(e.customer_id);
        }

      } else if (e.event_type === "followup") {
        followupsByMonth[monthKey] = (followupsByMonth[monthKey] || 0) + 1;
        followupsPerCustomer[e.customer_id] = (followupsPerCustomer[e.customer_id] || 0) + 1;
        
        if (e.followup_outcome === "promise_made") {
          customersWithPromises.add(e.customer_id);
        }
      }
    });

    const promiseKeptRate = customersWithPromises.size > 0 
      ? (customersWithPromisesKept.size / customersWithPromises.size) * 100 
      : 0;

    const avgFollowupsBeforePayment = customersWithFollowupsAndPaid > 0 
      ? (followupsBeforePaymentCount / customersWithFollowupsAndPaid).toFixed(1) 
      : 0;

    const monthlyData = Object.entries(collectionsByMonth)
      .map(([month, amount]) => ({ month, amount }))
      .reverse(); 

    const followupData = Object.entries(followupsByMonth)
      .map(([month, count]) => ({ month, count }))
      .reverse();

    const agingData = [
      { name: "1-30 Days", amount: agingBuckets["1-30"] },
      { name: "31-60 Days", amount: agingBuckets["31-60"] },
      { name: "61-90 Days", amount: agingBuckets["61-90"] },
      { name: "90+ Days", amount: agingBuckets["90+"] },
    ].filter(d => d.amount > 0);

    const statusData = [
      { name: "Paid", value: paidCount, color: "#10b981" },
      { name: "Outstanding", value: outstandingCount, color: "#3b82f6" },
      { name: "Overdue", value: overdueCount, color: "#ef4444" },
    ].filter(d => d.value > 0);

    return {
      totalCollected,
      totalOutstanding,
      totalOverdue,
      avgDaysOverdue,
      avgDaysToPayment,
      collectionRate,
      revenueThisMonth,
      revenueLastMonth,
      promiseKeptRate,
      avgFollowupsBeforePayment,
      statusData,
      monthlyData,
      followupData,
      agingData,
      topOffenders,
      worstClients,
      totalCustomers: customers.length,
    };
  }, [customers, events]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-sm text-zinc-400 mb-1">{label}</p>
          <p className="text-sm font-bold text-zinc-100">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{stats.totalCustomers}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{formatCurrency(stats.totalCollected)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Outstanding Balance</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{formatCurrency(stats.totalOutstanding)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Avg Days Overdue</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{stats.avgDaysOverdue} <span className="text-sm font-normal text-zinc-500">days</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Top Stats Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Avg Time to Pay</CardTitle>
            <Clock className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{stats.avgDaysToPayment} <span className="text-sm font-normal text-zinc-500">days</span></div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Collection Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{stats.collectionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Promise Kept Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{stats.promiseKeptRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Avg Follow-ups to Pay</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{stats.avgFollowupsBeforePayment}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-white/[0.02] border-white/10">
          <CardHeader>
            <CardTitle className="text-zinc-100">Collection Trends</CardTitle>
            <CardDescription>Monthly revenue collected over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {stats.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
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

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader>
            <CardTitle className="text-zinc-100">Customer Status</CardTitle>
            <CardDescription>Breakdown of your pipeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex flex-col items-center justify-center">
              {stats.statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px' }}
                      itemStyle={{ color: '#f4f4f5' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-zinc-600">
                  No customers added.
                </div>
              )}
              {stats.statusData.length > 0 && (
                <div className="flex justify-center gap-4 mt-2">
                  {stats.statusData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs text-zinc-400">{entry.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader>
            <CardTitle className="text-zinc-100">Top Offenders</CardTitle>
            <CardDescription>Customers with the highest overdue balances.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {stats.topOffenders.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topOffenders} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                    <XAxis type="number" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey="amount" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-600">
                  No overdue customers right now. Nice!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader>
            <CardTitle className="text-zinc-100">A/R Aging</CardTitle>
            <CardDescription>Overdue balances bucketed by age.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {stats.agingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.agingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-600">
                  No aging balances.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-white/[0.02] border-white/10">
          <CardHeader>
            <CardTitle className="text-zinc-100">Follow-up Activity</CardTitle>
            <CardDescription>Number of follow-up messages sent per month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {stats.followupData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.followupData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px' }}
                      itemStyle={{ color: '#f4f4f5' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} name="Follow-ups" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-600">
                  No follow-up activity yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader>
            <CardTitle className="text-zinc-100">Agency Insights</CardTitle>
            <CardDescription>Deep dive into your portfolio health.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-sm font-medium text-zinc-300 mb-1">Revenue Momentum</h4>
                <p className="text-sm text-zinc-500">
                  You collected <strong className="text-emerald-400">{formatCurrency(stats.revenueThisMonth)}</strong> this month, compared to {formatCurrency(stats.revenueLastMonth)} last month.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-sm font-medium text-zinc-300 mb-1">Portfolio Risk</h4>
                <p className="text-sm text-zinc-500">
                  {stats.worstClients.length > 0 ? (
                    <>Your highest risk clients are currently averaging <strong className="text-red-400">{stats.worstClients[0]?.days || 0} days</strong> overdue.</>
                  ) : (
                    <>You have no severely overdue clients right now.</>
                  )}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-sm font-medium text-zinc-300 mb-1">Efficiency</h4>
                <p className="text-sm text-zinc-500">
                  On average, it takes <strong className="text-blue-400">{stats.avgFollowupsBeforePayment} follow-ups</strong> to secure a payment after the due date.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
