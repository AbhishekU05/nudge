/* eslint-disable */
"use client";

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
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, AlertCircle, Clock, Info } from "lucide-react";

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

// Shape returned by the get_collection_analytics RPC
interface AnalyticsData {
  stats: {
    total_collected: number;
    total_outstanding: number;
    total_overdue: number;
    overdue_count: number;
    paid_count: number;
    outstanding_count: number;
    total_days_overdue: number;
    total_invoices: number;
    this_month_paid_count: number;
    this_month_outstanding_count: number;
    this_month_overdue_count: number;
    collection_rate: number;
    avg_days_overdue: number;
  };
  topOffenders: Array<{ name: string; amount: number; days: number }>;
  worstClient: { name: string; days: number } | null;
  agingBuckets: {
    bucket_1_30: number;
    bucket_31_60: number;
    bucket_61_90: number;
    bucket_90_plus: number;
  };
  forecastBuckets: {
    bucket_0_30: number;
    bucket_31_60: number;
    bucket_61_90: number;
  };
  revenue: {
    revenue_this_month: number;
    revenue_last_month: number;
  };
  monthlyCollections: Array<{ month: string; amount: number }>;
  monthlyFollowups: Array<{ month: string; count: number }>;
}

export function AnalyticsClient({
  data,
  currency = "USD",
}: {
  data: AnalyticsData | null;
  currency?: string;
}) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-sm text-zinc-400 mb-1">{label}</p>
          <p className="text-sm font-bold text-zinc-100">
            {formatCurrency(payload[0].value, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || !data.stats) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        No analytics data available yet.
      </div>
    );
  }

  const { stats, topOffenders, worstClient, agingBuckets, forecastBuckets, revenue, monthlyCollections, monthlyFollowups } = data;

  const collectionRate = stats.collection_rate;
  const avgDaysOverdue = stats.avg_days_overdue;

  const agingData = [
    { name: "1-30 Days", amount: agingBuckets.bucket_1_30 },
    { name: "31-60 Days", amount: agingBuckets.bucket_31_60 },
    { name: "61-90 Days", amount: agingBuckets.bucket_61_90 },
    { name: "90+ Days", amount: agingBuckets.bucket_90_plus },
  ].filter((d) => d.amount > 0);

  const forecastData = [
    { name: "Next 30 Days", amount: forecastBuckets.bucket_0_30 },
    { name: "31-60 Days", amount: forecastBuckets.bucket_31_60 },
    { name: "61-90 Days", amount: forecastBuckets.bucket_61_90 },
  ];

  const statusData = [
    { name: "Paid", value: stats.this_month_paid_count, color: "#10b981" },
    { name: "Outstanding", value: stats.this_month_outstanding_count, color: "#3b82f6" },
    { name: "Overdue", value: stats.this_month_overdue_count, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Stats Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help" title="The total number of invoices in your pipeline.">
              Total Invoices
              <Info className="h-3.5 w-3.5 text-zinc-600" />
            </CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{stats.total_invoices}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help" title="The total amount of money you have successfully collected.">
              Total Collected
              <Info className="h-3.5 w-3.5 text-zinc-600" />
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{formatCurrency(stats.total_collected, currency)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help" title="The total amount of money currently owed.">
              Outstanding Balance
              <Info className="h-3.5 w-3.5 text-zinc-600" />
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{formatCurrency(stats.total_outstanding, currency)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help" title="Average days past due date for overdue invoices.">
              Avg Days Overdue
              <Info className="h-3.5 w-3.5 text-zinc-600" />
            </CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{avgDaysOverdue} <span className="text-sm font-normal text-zinc-500">days</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Top Stats Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help" title="Percentage of total billed amount that has been collected.">
              Collection Rate
              <Info className="h-3.5 w-3.5 text-zinc-600" />
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{collectionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help" title="Total overdue amount across all invoices.">
              Overdue Risk
              <Info className="h-3.5 w-3.5 text-zinc-600" />
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{formatCurrency(stats.total_overdue, currency)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help" title="Number of invoices currently overdue.">
              Overdue Count
              <Info className="h-3.5 w-3.5 text-zinc-600" />
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{stats.overdue_count}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help" title="Revenue collected this month vs last month.">
              Revenue This Month
              <Info className="h-3.5 w-3.5 text-zinc-600" />
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{formatCurrency(revenue.revenue_this_month, currency)}</div>
            <p className="text-xs text-zinc-500 mt-1">vs {formatCurrency(revenue.revenue_last_month, currency)} last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-white/[0.02] border-white/10">
          <CardHeader>
            <CardTitle className="text-zinc-100">Collection Trends</CardTitle>
            <CardDescription>Monthly revenue collected over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {monthlyCollections.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyCollections} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, currency)} />
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
            <CardTitle className="text-zinc-100">This Month's Pipeline</CardTitle>
            <CardDescription>Status of invoices created this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex flex-col items-center justify-center">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
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
                  No invoices added this month.
                </div>
              )}
              {statusData.length > 0 && (
                <div className="flex justify-center gap-4 mt-2">
                  {statusData.map((entry) => (
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
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader>
            <CardTitle className="text-zinc-100">Top Offenders</CardTitle>
            <CardDescription>Customers with the highest overdue balances.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {topOffenders.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topOffenders} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                    <XAxis type="number" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, currency)} />
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
              {agingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, currency)} />
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
                  You collected <strong className="text-emerald-400">{formatCurrency(revenue.revenue_this_month, currency)}</strong> this month, compared to {formatCurrency(revenue.revenue_last_month, currency)} last month.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-sm font-medium text-zinc-300 mb-1">Portfolio Risk</h4>
                <p className="text-sm text-zinc-500">
                  {worstClient ? (
                    <>Your highest risk client is currently <strong className="text-red-400">{worstClient.days} days</strong> overdue.</>
                  ) : (
                    <>You have no severely overdue clients right now.</>
                  )}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-sm font-medium text-zinc-300 mb-1">Collection Health</h4>
                <p className="text-sm text-zinc-500">
                  Your overall collection rate is <strong className="text-blue-400">{collectionRate.toFixed(1)}%</strong> of total billed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-white/[0.02] border-white/10">
          <CardHeader>
            <CardTitle className="text-zinc-100">Follow-up Activity</CardTitle>
            <CardDescription>Number of follow-up messages sent per month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {monthlyFollowups.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFollowups} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-emerald-400">Next 30 Days</CardTitle>
            <CardDescription className="text-emerald-500/70">Expected cash collection.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center py-8">
            <DollarSign className="h-10 w-10 text-emerald-500 mb-4" />
            <div className="text-4xl font-bold text-emerald-400">{formatCurrency(forecastBuckets.bucket_0_30, currency)}</div>
            <p className="text-sm text-emerald-500/80 mt-4 text-center px-4">
              From invoices due in the next 30 days.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expected Collections Chart */}
      <Card className="bg-white/[0.02] border-white/10">
        <CardHeader>
          <CardTitle className="text-zinc-100">Cash Flow Forecast</CardTitle>
          <CardDescription>Expected inflows based on upcoming due dates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            {forecastData.some((d) => d.amount > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, currency)} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    content={<CustomTooltip />}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-600">
                No expected cash flow recorded.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
