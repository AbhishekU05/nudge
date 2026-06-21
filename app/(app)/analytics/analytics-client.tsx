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

    customers.forEach((c) => {
      const paid = Number(c.amount_paid) || 0;
      const owed = Number(c.amount_owed) || 0;
      const remaining = Math.max(0, owed - paid);
      
      totalCollected += paid;
      totalOutstanding += remaining;

      const isPaid = remaining <= 0 || c.client_paid_at;
      const daysOverdue = getDaysOverdue(c);

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
      } else {
        outstandingCount++;
      }
    });

    const avgDaysOverdue = overdueCount > 0 ? Math.round(totalDaysOverdue / overdueCount) : 0;
    
    // Sort offenders by amount
    const topOffenders = offenders.sort((a, b) => b.amount - a.amount).slice(0, 5);

    // Monthly collections
    const collectionsByMonth: Record<string, number> = {};
    events.forEach(e => {
      if (e.event_type === "payment" && e.amount) {
        const date = new Date(e.created_at);
        const monthKey = format(date, "MMM yyyy");
        collectionsByMonth[monthKey] = (collectionsByMonth[monthKey] || 0) + Number(e.amount);
      }
    });

    // We want the last 6 months in chronological order
    const monthlyData = Object.entries(collectionsByMonth)
      .map(([month, amount]) => ({ month, amount }))
      // In a real app we'd fill missing months, but this is a simplified version
      .reverse(); 

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
      statusData,
      monthlyData,
      topOffenders,
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
      {/* Top Stats */}
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

      {/* Bottom Row */}
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
            <CardTitle className="text-zinc-100">Quick Facts</CardTitle>
            <CardDescription>Actionable insights based on your data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-sm font-medium text-zinc-300 mb-1">Total Risk</h4>
                <p className="text-sm text-zinc-500">
                  You have <strong className="text-red-400">{formatCurrency(stats.totalOverdue)}</strong> in overdue invoices across your entire customer base.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-sm font-medium text-zinc-300 mb-1">Collection Rate</h4>
                <p className="text-sm text-zinc-500">
                  Compared to your total outstanding balance of {formatCurrency(stats.totalOutstanding)}, you've collected {formatCurrency(stats.totalCollected)} so far.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
