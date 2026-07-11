"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { InvoiceRecord, getRemainingBalance } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

export function CustomerAnalytics({ invoices }: { invoices: InvoiceRecord[] }) {
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let sumDaysOverdue = 0;
    let overdueCount = 0;

    const statusCounts = {
      Paid: 0,
      Outstanding: 0,
      Overdue: 0,
    };

    const monthlyDataMap: Record<string, number> = {};

    const now = new Date();
    
    invoices.forEach(inv => {
      const remaining = getRemainingBalance(inv);
      const isPaid = inv.workflow_status === "paid" || inv.workflow_status === "written_off" || remaining === 0;
      
      const dueDate = inv.due_date ? new Date(inv.due_date) : null;
      const isOverdue = !isPaid && dueDate && dueDate < now;

      totalInvoiced += inv.amount_owed || 0;
      
      if (isPaid) {
        totalPaid += inv.amount_owed || 0;
        statusCounts.Paid += inv.amount_owed || 0;
      } else {
        totalOutstanding += remaining;
        if (isOverdue) {
          totalOverdue += remaining;
          statusCounts.Overdue += remaining;
          
          if (dueDate) {
            const diffTime = Math.abs(now.getTime() - dueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            sumDaysOverdue += diffDays;
            overdueCount++;
          }
        } else {
          statusCounts.Outstanding += remaining;
        }
      }

      // Group by month for bar chart
      if (inv.created_at) {
        const d = new Date(inv.created_at);
        const monthYear = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        if (!monthlyDataMap[monthYear]) monthlyDataMap[monthYear] = 0;
        monthlyDataMap[monthYear] += inv.amount_owed || 0;
      }
    });

    const avgDaysOverdue = overdueCount > 0 ? Math.round(sumDaysOverdue / overdueCount) : 0;
    const currency = invoices[0]?.currency || "USD";

    const formatCurrency = (val: number) => 
      new Intl.NumberFormat("en-US", { style: "currency", currency }).format(val);

    const pieData = [
      { name: "Paid", value: statusCounts.Paid, color: "#10b981" },
      { name: "Outstanding", value: statusCounts.Outstanding, color: "#f59e0b" },
      { name: "Overdue", value: statusCounts.Overdue, color: "#ef4444" },
    ].filter(d => d.value > 0);

    const barData = Object.entries(monthlyDataMap).map(([month, amount]) => ({
      month,
      amount
    }));

    return {
      totalInvoiced: formatCurrency(totalInvoiced),
      totalPaid: formatCurrency(totalPaid),
      totalOutstanding: formatCurrency(totalOutstanding),
      totalOverdue: formatCurrency(totalOverdue),
      avgDaysOverdue,
      pieData,
      barData,
      formatCurrency
    };
  }, [invoices]);

  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 text-center text-zinc-500">
        No analytics available. Add some invoices to see charts and stats.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-white/10 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Invoiced</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{stats.totalInvoiced}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900/50 border-white/10 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{stats.totalPaid}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/10 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{stats.totalOutstanding}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/10 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Avg. Days Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">{stats.avgDaysOverdue} <span className="text-base font-normal text-zinc-500">days</span></div>
            <p className="text-xs text-rose-400/80 mt-1">{stats.totalOverdue} total overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-zinc-900/50 border-white/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-medium text-zinc-200">Balance Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: unknown) => stats.formatCurrency(Number(value) || 0)}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-medium text-zinc-200">Invoiced Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <RechartsTooltip 
                  formatter={(value: unknown) => stats.formatCurrency(Number(value) || 0)}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
