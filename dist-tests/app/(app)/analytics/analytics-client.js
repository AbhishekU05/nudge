"use strict";
/* eslint-disable */
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsClient = AnalyticsClient;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const recharts_1 = require("recharts");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const types_1 = require("@/lib/types");
const date_fns_1 = require("date-fns");
const COLORS = ["#10b981", "#3b82f6", "#ef4444", "#f59e0b"];
function formatCurrency(value, currency = "USD") {
    return new Intl.NumberFormat(undefined, {
        currency,
        style: "currency",
        maximumFractionDigits: 0,
    }).format(Number(value));
}
function AnalyticsClient({ customers, events, currency = "USD", }) {
    const stats = (0, react_1.useMemo)(() => {
        let totalCollected = 0;
        let totalOutstanding = 0;
        let totalOverdue = 0;
        let overdueCount = 0;
        let paidCount = 0;
        let outstandingCount = 0;
        let totalDaysOverdue = 0;
        const offenders = [];
        // Aging Buckets
        const agingBuckets = {
            "1-30": 0,
            "31-60": 0,
            "61-90": 0,
            "90+": 0,
        };
        // Forecast Buckets
        const forecastBuckets = {
            "0-30 Days": 0,
            "31-60 Days": 0,
            "61-90 Days": 0,
        };
        // Monthly Follow-ups
        // New Metrics variables
        let totalDaysToPayment = 0;
        let paidCustomersWithDates = 0;
        const customersWithPromises = new Set();
        const customersWithPromisesKept = new Set();
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
            const daysOverdue = (0, types_1.getDaysOverdue)(c);
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
            }
            else if (daysOverdue && daysOverdue > 0) {
                overdueCount++;
                totalOverdue += remaining;
                totalDaysOverdue += daysOverdue;
                offenders.push({
                    name: c.recipient_name || "Unknown",
                    amount: remaining,
                    days: daysOverdue,
                });
                // Add to aging bucket
                if (daysOverdue <= 30)
                    agingBuckets["1-30"] += remaining;
                else if (daysOverdue <= 60)
                    agingBuckets["31-60"] += remaining;
                else if (daysOverdue <= 90)
                    agingBuckets["61-90"] += remaining;
                else
                    agingBuckets["90+"] += remaining;
            }
            else {
                outstandingCount++;
            }
            // Cash flow forecast based on expected payment date (promised_date or due_date)
            if (!isPaid && remaining > 0) {
                let expectedDate = null;
                if (c.promised_date) {
                    expectedDate = new Date(c.promised_date);
                }
                else if (c.due_date) {
                    expectedDate = new Date(c.due_date);
                }
                if (expectedDate && expectedDate.getTime() > now.getTime()) {
                    const diffDays = Math.ceil((expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 30) {
                        forecastBuckets["0-30 Days"] += remaining;
                    }
                    else if (diffDays <= 60) {
                        forecastBuckets["31-60 Days"] += remaining;
                    }
                    else if (diffDays <= 90) {
                        forecastBuckets["61-90 Days"] += remaining;
                    }
                }
            }
        });
        const avgDaysOverdue = overdueCount > 0 ? Math.round(totalDaysOverdue / overdueCount) : 0;
        const avgDaysToPayment = paidCustomersWithDates > 0 ? Math.round(totalDaysToPayment / paidCustomersWithDates) : 0;
        const collectionRate = (totalCollected + totalOutstanding) > 0 ? (totalCollected / (totalCollected + totalOutstanding)) * 100 : 0;
        // Sort offenders by amount
        const topOffenders = offenders.sort((a, b) => b.amount - a.amount).slice(0, 5);
        const worstClients = [...offenders].sort((a, b) => b.days - a.days).slice(0, 3); // Highest days overdue
        // Event Loop for Advanced Metrics
        const collectionsByMonth = {};
        const followupsByMonth = {};
        // Pre-fill last 6 months to guarantee they appear in correct chronological order
        for (let i = 5; i >= 0; i--) {
            const d = new Date(currentYear, currentMonth - i, 1);
            const mKey = (0, date_fns_1.format)(d, "MMM yyyy");
            collectionsByMonth[mKey] = 0;
            followupsByMonth[mKey] = 0;
        }
        // Map of customer_id to number of followups
        const followupsPerCustomer = {};
        events.forEach(e => {
            const date = new Date(e.event_date || e.created_at);
            const monthKey = (0, date_fns_1.format)(date, "MMM yyyy");
            const eMonth = date.getMonth();
            const eYear = date.getFullYear();
            if (e.event_type === "payment" && e.amount) {
                if (collectionsByMonth[monthKey] !== undefined) {
                    collectionsByMonth[monthKey] += Number(e.amount);
                }
                if (eMonth === currentMonth && eYear === currentYear) {
                    revenueThisMonth += Number(e.amount);
                }
                else if (eMonth === lastMonth && eYear === lastMonthYear) {
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
            }
            else if (e.event_type === "followup") {
                if (followupsByMonth[monthKey] !== undefined) {
                    followupsByMonth[monthKey] += 1;
                }
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
            .map(([month, amount]) => ({ month, amount }));
        const followupData = Object.entries(followupsByMonth)
            .map(([month, count]) => ({ month, count }));
        const agingData = [
            { name: "1-30 Days", amount: agingBuckets["1-30"] },
            { name: "31-60 Days", amount: agingBuckets["31-60"] },
            { name: "61-90 Days", amount: agingBuckets["61-90"] },
            { name: "90+ Days", amount: agingBuckets["90+"] },
        ].filter(d => d.amount > 0);
        const forecastData = [
            { name: "Next 30 Days", amount: forecastBuckets["0-30 Days"] },
            { name: "31-60 Days", amount: forecastBuckets["31-60 Days"] },
            { name: "61-90 Days", amount: forecastBuckets["61-90 Days"] },
        ];
        const expected30Days = forecastBuckets["0-30 Days"];
        // Recalculate status counts ONLY for customers created this month
        let thisMonthPaidCount = 0;
        let thisMonthOutstandingCount = 0;
        let thisMonthOverdueCount = 0;
        customers.forEach((c) => {
            const cDate = new Date(c.created_at);
            if (cDate.getMonth() === currentMonth && cDate.getFullYear() === currentYear) {
                const paid = Number(c.amount_paid) || 0;
                const owed = Number(c.amount_owed) || 0;
                const remaining = Math.max(0, owed - paid);
                const isPaid = remaining <= 0 || c.client_paid_at;
                const daysOverdue = (0, types_1.getDaysOverdue)(c);
                if (isPaid) {
                    thisMonthPaidCount++;
                }
                else if (daysOverdue && daysOverdue > 0) {
                    thisMonthOverdueCount++;
                }
                else {
                    thisMonthOutstandingCount++;
                }
            }
        });
        const statusData = [
            { name: "Paid", value: thisMonthPaidCount, color: "#10b981" },
            { name: "Outstanding", value: thisMonthOutstandingCount, color: "#3b82f6" },
            { name: "Overdue", value: thisMonthOverdueCount, color: "#ef4444" },
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
            forecastData,
            expected30Days,
            topOffenders,
            worstClients,
            totalCustomers: customers.length,
        };
    }, [customers, events]);
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-zinc-900 border border-white/10 p-3 rounded-lg shadow-xl", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-400 mb-1", children: label }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-bold text-zinc-100", children: formatCurrency(payload[0].value, currency) })] }));
        }
        return null;
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help", title: "The total number of customers in your pipeline.", children: ["Total Customers", (0, jsx_runtime_1.jsx)(lucide_react_1.Info, { className: "h-3.5 w-3.5 text-zinc-600" })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "h-4 w-4 text-zinc-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-zinc-50", children: stats.totalCustomers }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help", title: "The total amount of money you have successfully collected.", children: ["Total Collected", (0, jsx_runtime_1.jsx)(lucide_react_1.Info, { className: "h-3.5 w-3.5 text-zinc-600" })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "h-4 w-4 text-emerald-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-zinc-50", children: formatCurrency(stats.totalCollected, currency) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help", title: "The total amount of money currently owed by your customers.", children: ["Outstanding Balance", (0, jsx_runtime_1.jsx)(lucide_react_1.Info, { className: "h-3.5 w-3.5 text-zinc-600" })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-4 w-4 text-blue-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-zinc-50", children: formatCurrency(stats.totalOutstanding, currency) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help", title: "The average number of days past the due date for overdue invoices.", children: ["Avg Days Overdue", (0, jsx_runtime_1.jsx)(lucide_react_1.Info, { className: "h-3.5 w-3.5 text-zinc-600" })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-4 w-4 text-red-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "text-2xl font-bold text-zinc-50", children: [stats.avgDaysOverdue, " ", (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-normal text-zinc-500", children: "days" })] }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help", title: "The average number of days it takes for customers to pay after the invoice date.", children: ["Avg Time to Pay", (0, jsx_runtime_1.jsx)(lucide_react_1.Info, { className: "h-3.5 w-3.5 text-zinc-600" })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-4 w-4 text-zinc-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "text-2xl font-bold text-zinc-50", children: [stats.avgDaysToPayment, " ", (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-normal text-zinc-500", children: "days" })] }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help", title: "The percentage of total billed amount that has been collected.", children: ["Collection Rate", (0, jsx_runtime_1.jsx)(lucide_react_1.Info, { className: "h-3.5 w-3.5 text-zinc-600" })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "h-4 w-4 text-emerald-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "text-2xl font-bold text-zinc-50", children: [stats.collectionRate.toFixed(1), "%"] }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help", title: "The percentage of customers who paid on or before their promised date.", children: ["Promise Kept Rate", (0, jsx_runtime_1.jsx)(lucide_react_1.Info, { className: "h-3.5 w-3.5 text-zinc-600" })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-4 w-4 text-blue-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "text-2xl font-bold text-zinc-50", children: [stats.promiseKeptRate.toFixed(1), "%"] }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "text-sm font-medium text-zinc-400 flex items-center gap-1.5 cursor-help", title: "The average number of follow-up messages sent before a payment is received.", children: ["Avg Follow-ups to Pay", (0, jsx_runtime_1.jsx)(lucide_react_1.Info, { className: "h-3.5 w-3.5 text-zinc-600" })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "h-4 w-4 text-purple-500" })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-zinc-50", children: stats.avgFollowupsBeforePayment }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-6 lg:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "lg:col-span-2 bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-zinc-100", children: "Collection Trends" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Monthly revenue collected over time." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "h-[300px] w-full", children: stats.monthlyData.length > 0 ? ((0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.AreaChart, { data: stats.monthlyData, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [(0, jsx_runtime_1.jsx)("defs", { children: (0, jsx_runtime_1.jsxs)("linearGradient", { id: "colorAmount", x1: "0", y1: "0", x2: "0", y2: "1", children: [(0, jsx_runtime_1.jsx)("stop", { offset: "5%", stopColor: "#10b981", stopOpacity: 0.3 }), (0, jsx_runtime_1.jsx)("stop", { offset: "95%", stopColor: "#10b981", stopOpacity: 0 })] }) }), (0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10", vertical: false }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "month", stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false, tickFormatter: (v) => formatCurrency(v, currency) }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { content: (0, jsx_runtime_1.jsx)(CustomTooltip, {}) }), (0, jsx_runtime_1.jsx)(recharts_1.Area, { type: "monotone", dataKey: "amount", stroke: "#10b981", strokeWidth: 2, fillOpacity: 1, fill: "url(#colorAmount)" })] }) })) : ((0, jsx_runtime_1.jsx)("div", { className: "flex h-full items-center justify-center text-sm text-zinc-600", children: "No payment data available yet." })) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-zinc-100", children: "This Month's Pipeline" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Status of customers added this month." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "h-[300px] w-full flex flex-col items-center justify-center", children: [stats.statusData.length > 0 ? ((0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.PieChart, { children: [(0, jsx_runtime_1.jsx)(recharts_1.Pie, { data: stats.statusData, cx: "50%", cy: "45%", innerRadius: 60, outerRadius: 80, paddingAngle: 5, dataKey: "value", children: stats.statusData.map((entry, index) => ((0, jsx_runtime_1.jsx)(recharts_1.Cell, { fill: entry.color }, `cell-${index}`))) }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { contentStyle: { backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px' }, itemStyle: { color: '#f4f4f5' } })] }) })) : ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-1 items-center justify-center text-sm text-zinc-600", children: "No customers added." })), stats.statusData.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "flex justify-center gap-4 mt-2", children: stats.statusData.map((entry) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: entry.color } }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-zinc-400", children: entry.name })] }, entry.name))) }))] }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-6 lg:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-zinc-100", children: "Top Offenders" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Customers with the highest overdue balances." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "h-[250px] w-full", children: stats.topOffenders.length > 0 ? ((0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.BarChart, { data: stats.topOffenders, layout: "vertical", margin: { top: 0, right: 30, left: 20, bottom: 0 }, children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10", horizontal: false }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { type: "number", stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false, tickFormatter: (v) => formatCurrency(v, currency) }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { type: "category", dataKey: "name", stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false, width: 80 }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { cursor: { fill: '#ffffff05' }, content: (0, jsx_runtime_1.jsx)(CustomTooltip, {}) }), (0, jsx_runtime_1.jsx)(recharts_1.Bar, { dataKey: "amount", fill: "#ef4444", radius: [0, 4, 4, 0], barSize: 20 })] }) })) : ((0, jsx_runtime_1.jsx)("div", { className: "flex h-full items-center justify-center text-sm text-zinc-600", children: "No overdue customers right now. Nice!" })) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-zinc-100", children: "A/R Aging" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Overdue balances bucketed by age." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "h-[250px] w-full", children: stats.agingData.length > 0 ? ((0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.BarChart, { data: stats.agingData, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10", vertical: false }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "name", stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false, tickFormatter: (v) => formatCurrency(v, currency) }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { cursor: { fill: '#ffffff05' }, content: (0, jsx_runtime_1.jsx)(CustomTooltip, {}) }), (0, jsx_runtime_1.jsx)(recharts_1.Bar, { dataKey: "amount", fill: "#f59e0b", radius: [4, 4, 0, 0], barSize: 40 })] }) })) : ((0, jsx_runtime_1.jsx)("div", { className: "flex h-full items-center justify-center text-sm text-zinc-600", children: "No aging balances." })) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-zinc-100", children: "Expected Collections" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Upcoming invoices bucketed by due date." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "h-[250px] w-full", children: stats.forecastData.length > 0 ? ((0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.BarChart, { data: stats.forecastData, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10", vertical: false }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "name", stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false, tickFormatter: (v) => formatCurrency(v, currency) }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { cursor: { fill: '#ffffff05' }, content: (0, jsx_runtime_1.jsx)(CustomTooltip, {}) }), (0, jsx_runtime_1.jsx)(recharts_1.Bar, { dataKey: "amount", fill: "#3b82f6", radius: [4, 4, 0, 0], barSize: 40 })] }) })) : ((0, jsx_runtime_1.jsx)("div", { className: "flex h-full items-center justify-center text-sm text-zinc-600", children: "No upcoming invoices." })) }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-6 lg:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "lg:col-span-2 bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-zinc-100", children: "Follow-up Activity" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Number of follow-up messages sent per month." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "h-[250px] w-full", children: stats.followupData.length > 0 ? ((0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.BarChart, { data: stats.followupData, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10", vertical: false }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "month", stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { cursor: { fill: '#ffffff05' }, contentStyle: { backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '8px' }, itemStyle: { color: '#f4f4f5' } }), (0, jsx_runtime_1.jsx)(recharts_1.Bar, { dataKey: "count", fill: "#3b82f6", radius: [4, 4, 0, 0], barSize: 40, name: "Follow-ups" })] }) })) : ((0, jsx_runtime_1.jsx)("div", { className: "flex h-full items-center justify-center text-sm text-zinc-600", children: "No follow-up activity yet." })) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-zinc-100", children: "Agency Insights" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Deep dive into your portfolio health." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-4 rounded-xl border border-white/5 bg-white/[0.02]", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-medium text-zinc-300 mb-1", children: "Revenue Momentum" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-zinc-500", children: ["You collected ", (0, jsx_runtime_1.jsx)("strong", { className: "text-emerald-400", children: formatCurrency(stats.revenueThisMonth, currency) }), " this month, compared to ", formatCurrency(stats.revenueLastMonth, currency), " last month."] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 rounded-xl border border-white/5 bg-white/[0.02]", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-medium text-zinc-300 mb-1", children: "Portfolio Risk" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-500", children: stats.worstClients.length > 0 ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: ["Your highest risk clients are currently averaging ", (0, jsx_runtime_1.jsxs)("strong", { className: "text-red-400", children: [stats.worstClients[0]?.days || 0, " days"] }), " overdue."] })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: "You have no severely overdue clients right now." })) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 rounded-xl border border-white/5 bg-white/[0.02]", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-medium text-zinc-300 mb-1", children: "Efficiency" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-zinc-500", children: ["On average, it takes ", (0, jsx_runtime_1.jsxs)("strong", { className: "text-blue-400", children: [stats.avgFollowupsBeforePayment, " follow-ups"] }), " to secure a payment after the due date."] })] })] }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-6 lg:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "lg:col-span-2 bg-white/[0.02] border-white/10", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-zinc-100", children: "Cash Flow Forecast" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { children: "Expected inflows based on promise dates and upcoming due dates." })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("div", { className: "h-[250px] w-full", children: stats.forecastData.some(d => d.amount > 0) ? ((0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.BarChart, { data: stats.forecastData, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "#ffffff10", vertical: false }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "name", stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { stroke: "#a1a1aa", fontSize: 12, tickLine: false, axisLine: false, tickFormatter: (v) => `$${v}` }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { cursor: { fill: '#ffffff05' }, content: (0, jsx_runtime_1.jsx)(CustomTooltip, {}) }), (0, jsx_runtime_1.jsx)(recharts_1.Bar, { dataKey: "amount", fill: "#10b981", radius: [4, 4, 0, 0], barSize: 40 })] }) })) : ((0, jsx_runtime_1.jsx)("div", { className: "flex h-full items-center justify-center text-sm text-zinc-600", children: "No expected cash flow recorded." })) }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "bg-emerald-500/10 border-emerald-500/20", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-emerald-400", children: "Next 30 Days" }), (0, jsx_runtime_1.jsx)(card_1.CardDescription, { className: "text-emerald-500/70", children: "Expected cash collection." })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "flex flex-col justify-center items-center py-8", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "h-10 w-10 text-emerald-500 mb-4" }), (0, jsx_runtime_1.jsx)("div", { className: "text-4xl font-bold text-emerald-400", children: formatCurrency(stats.expected30Days, currency) }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-emerald-500/80 mt-4 text-center px-4", children: "If all clients with upcoming due dates and promise dates pay on time." })] })] })] })] }));
}
