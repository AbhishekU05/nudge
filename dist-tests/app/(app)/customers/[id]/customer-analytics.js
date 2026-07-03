"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerAnalytics = CustomerAnalytics;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const recharts_1 = require("recharts");
const types_1 = require("@/lib/types");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
function CustomerAnalytics({ invoices }) {
    const stats = (0, react_1.useMemo)(() => {
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
        const monthlyDataMap = {};
        const now = new Date();
        invoices.forEach(inv => {
            const remaining = (0, types_1.getRemainingBalance)(inv);
            const isPaid = inv.workflow_status === "paid" || remaining === 0;
            const dueDate = inv.due_date ? new Date(inv.due_date) : null;
            const isOverdue = !isPaid && dueDate && dueDate < now;
            totalInvoiced += inv.amount_owed || 0;
            if (isPaid) {
                totalPaid += inv.amount_owed || 0;
                statusCounts.Paid += inv.amount_owed || 0;
            }
            else {
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
                }
                else {
                    statusCounts.Outstanding += remaining;
                }
            }
            // Group by month for bar chart
            if (inv.created_at) {
                const d = new Date(inv.created_at);
                const monthYear = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                if (!monthlyDataMap[monthYear])
                    monthlyDataMap[monthYear] = 0;
                monthlyDataMap[monthYear] += inv.amount_owed || 0;
            }
        });
        const avgDaysOverdue = overdueCount > 0 ? Math.round(sumDaysOverdue / overdueCount) : 0;
        const currency = invoices[0]?.currency || "USD";
        const formatCurrency = (val) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(val);
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
        return ((0, jsx_runtime_1.jsx)("div", { className: "rounded-2xl border border-white/10 bg-zinc-900/50 p-6 text-center text-zinc-500", children: "No analytics available. Add some invoices to see charts and stats." }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-zinc-900/50 border-white/10 shadow-none", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400", children: "Total Invoiced" }), (0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "h-4 w-4 text-blue-400" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-zinc-50", children: stats.totalInvoiced }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-zinc-900/50 border-white/10 shadow-none", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400", children: "Total Paid" }), (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-4 w-4 text-emerald-400" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-zinc-50", children: stats.totalPaid }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-zinc-900/50 border-white/10 shadow-none", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400", children: "Total Outstanding" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-4 w-4 text-amber-400" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-zinc-50", children: stats.totalOutstanding }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-zinc-900/50 border-white/10 shadow-none", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400", children: "Avg. Days Overdue" }), (0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { className: "h-4 w-4 text-rose-400" })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-2xl font-bold text-zinc-50", children: [stats.avgDaysOverdue, " ", (0, jsx_runtime_1.jsx)("span", { className: "text-base font-normal text-zinc-500", children: "days" })] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-rose-400/80 mt-1", children: [stats.totalOverdue, " total overdue"] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-zinc-900/50 border-white/10 shadow-none", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-base font-medium text-zinc-200", children: "Balance Breakdown" }) }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "h-[300px]", children: (0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.PieChart, { children: [(0, jsx_runtime_1.jsx)(recharts_1.Pie, { data: stats.pieData, cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 80, paddingAngle: 5, dataKey: "value", stroke: "none", children: stats.pieData.map((entry, index) => ((0, jsx_runtime_1.jsx)(recharts_1.Cell, { fill: entry.color }, `cell-${index}`))) }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { formatter: (value) => stats.formatCurrency(Number(value) || 0), contentStyle: { backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' } }), (0, jsx_runtime_1.jsx)(recharts_1.Legend, {})] }) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-zinc-900/50 border-white/10 shadow-none", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-base font-medium text-zinc-200", children: "Invoiced Over Time" }) }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "h-[300px]", children: (0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.BarChart, { data: stats.barData, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)", vertical: false }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "month", stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false, tickFormatter: (val) => `$${val}` }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { formatter: (value) => stats.formatCurrency(Number(value) || 0), cursor: { fill: 'rgba(255,255,255,0.05)' }, contentStyle: { backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' } }), (0, jsx_runtime_1.jsx)(recharts_1.Bar, { dataKey: "amount", fill: "#4f46e5", radius: [4, 4, 0, 0] })] }) }) })] })] })] }));
}
