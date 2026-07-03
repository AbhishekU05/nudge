"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyDigestEmail = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const WeeklyDigestEmail = ({ dateRange, currencies }) => {
    return ((0, jsx_runtime_1.jsxs)(components_1.Html, { children: [(0, jsx_runtime_1.jsx)(components_1.Head, {}), (0, jsx_runtime_1.jsx)(components_1.Preview, { children: "Your weekly collections snapshot - Duely" }), (0, jsx_runtime_1.jsx)(components_1.Body, { style: main, children: (0, jsx_runtime_1.jsxs)(components_1.Container, { style: container, children: [(0, jsx_runtime_1.jsxs)(components_1.Section, { style: header, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: logoText, children: "Duely" }), (0, jsx_runtime_1.jsx)(components_1.Heading, { style: heading, children: "Your weekly collections snapshot" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: dateText, children: dateRange })] }), (!currencies || currencies.length === 0) && ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: section, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: metricValue, children: "All caught up!" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: metricLabel, children: "No outstanding invoices or activities found." })] })), currencies && currencies.map((curr, cIdx) => ((0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '40px' }, children: [(0, jsx_runtime_1.jsxs)(components_1.Heading, { style: currencyTitle, children: [curr.currencyCode, " Analytics"] }), curr.actionItems && curr.actionItems.length > 0 && ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: actionItemsSection, children: [(0, jsx_runtime_1.jsx)(components_1.Heading, { style: sectionTitle, children: "Action Items" }), (0, jsx_runtime_1.jsx)("ul", { style: actionList, children: curr.actionItems.map((item, idx) => ((0, jsx_runtime_1.jsxs)("li", { style: actionListItem, children: ["\u2022 ", item] }, idx))) })] })), (0, jsx_runtime_1.jsx)(components_1.Section, { style: metricsSection, children: (0, jsx_runtime_1.jsxs)(components_1.Row, { children: [(0, jsx_runtime_1.jsxs)(components_1.Column, { style: metricCard, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: metricLabel, children: "Total Outstanding" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: metricValue, children: curr.totalOutstanding })] }), (0, jsx_runtime_1.jsxs)(components_1.Column, { style: metricCard, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: metricLabel, children: "Total Overdue" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: metricValueOverdue, children: curr.totalOverdue })] }), (0, jsx_runtime_1.jsxs)(components_1.Column, { style: metricCard, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: metricLabel, children: "Total Collected" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: metricValue, children: curr.totalCollected })] })] }) }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: metricsSection, children: (0, jsx_runtime_1.jsxs)(components_1.Row, { children: [(0, jsx_runtime_1.jsxs)(components_1.Column, { style: metricCard, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: metricLabel, children: "Collection Rate" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: metricValue, children: [curr.collectionRate.toFixed(1), "%"] })] }), (0, jsx_runtime_1.jsxs)(components_1.Column, { style: metricCard, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: metricLabel, children: "Avg Days to Pay" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: metricValue, children: curr.averageDaysToPayment })] }), (0, jsx_runtime_1.jsxs)(components_1.Column, { style: metricCard, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: metricLabel, children: "Avg Follow-ups to Pay" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: metricValue, children: curr.avgFollowupsBeforePayment })] })] }) }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: metricsSection, children: (0, jsx_runtime_1.jsxs)(components_1.Row, { children: [(0, jsx_runtime_1.jsx)(components_1.Column, { style: { width: "50%", paddingRight: "10px" }, children: (0, jsx_runtime_1.jsxs)("div", { style: chartContainer, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: chartTitle, children: "Expected Collections (Upcoming)" }), (0, jsx_runtime_1.jsx)(components_1.Img, { src: curr.forecastChartUrl, alt: "Expected Collections", width: "100%" })] }) }), (0, jsx_runtime_1.jsx)(components_1.Column, { style: { width: "50%", paddingLeft: "10px" }, children: (0, jsx_runtime_1.jsxs)("div", { style: chartContainer, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: chartTitle, children: "A/R Aging (Overdue)" }), (0, jsx_runtime_1.jsx)(components_1.Img, { src: curr.agingChartUrl, alt: "Aging", width: "100%" })] }) })] }) }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: metricsSection, children: (0, jsx_runtime_1.jsxs)(components_1.Row, { children: [(0, jsx_runtime_1.jsx)(components_1.Column, { style: { width: "50%", paddingRight: "10px" }, children: (0, jsx_runtime_1.jsxs)("div", { style: chartContainer, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: chartTitle, children: "Pipeline Status" }), (0, jsx_runtime_1.jsx)(components_1.Img, { src: curr.pipelineStatusChartUrl, alt: "Pipeline Status", width: "100%" })] }) }), (0, jsx_runtime_1.jsx)(components_1.Column, { style: { width: "50%", paddingLeft: "10px" }, children: (0, jsx_runtime_1.jsxs)("div", { style: chartContainer, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: chartTitle, children: "Collection Trends" }), (0, jsx_runtime_1.jsx)(components_1.Img, { src: curr.collectionTrendsChartUrl, alt: "Collection Trends", width: "100%" })] }) })] }) }), curr.overdueInvoices && curr.overdueInvoices.length > 0 && ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: section, children: [(0, jsx_runtime_1.jsx)(components_1.Heading, { style: sectionTitle, children: "Top Offenders" }), (0, jsx_runtime_1.jsx)(components_1.Img, { src: curr.topOffendersChartUrl, alt: "Top Offenders", width: "100%", style: { marginBottom: '15px' } }), (0, jsx_runtime_1.jsxs)("table", { style: table, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: th, children: "Client" }), (0, jsx_runtime_1.jsx)("th", { style: th, children: "Amount" }), (0, jsx_runtime_1.jsx)("th", { style: th, children: "Days Overdue" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: curr.overdueInvoices.map((inv, idx) => ((0, jsx_runtime_1.jsxs)("tr", { style: tr, children: [(0, jsx_runtime_1.jsx)("td", { style: td, children: inv.clientName }), (0, jsx_runtime_1.jsx)("td", { style: td, children: inv.amount }), (0, jsx_runtime_1.jsxs)("td", { style: { ...td, color: '#ef4444' }, children: [inv.daysOverdue, " days"] })] }, idx))) })] })] })), curr.upcomingInvoices && curr.upcomingInvoices.length > 0 && ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: section, children: [(0, jsx_runtime_1.jsx)(components_1.Heading, { style: sectionTitle, children: "Upcoming in 14 Days" }), (0, jsx_runtime_1.jsxs)("table", { style: table, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: th, children: "Client" }), (0, jsx_runtime_1.jsx)("th", { style: th, children: "Amount" }), (0, jsx_runtime_1.jsx)("th", { style: th, children: "Due In" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: curr.upcomingInvoices.map((inv, idx) => ((0, jsx_runtime_1.jsxs)("tr", { style: tr, children: [(0, jsx_runtime_1.jsx)("td", { style: td, children: inv.clientName }), (0, jsx_runtime_1.jsx)("td", { style: td, children: inv.amount }), (0, jsx_runtime_1.jsxs)("td", { style: { ...td, color: '#3b82f6' }, children: [inv.dueInDays, " days"] })] }, idx))) })] })] })), curr.promisesThisWeek && curr.promisesThisWeek.length > 0 && ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: section, children: [(0, jsx_runtime_1.jsx)(components_1.Heading, { style: sectionTitle, children: "Promises Due This Week (Unpaid)" }), (0, jsx_runtime_1.jsxs)("table", { style: table, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: th, children: "Client" }), (0, jsx_runtime_1.jsx)("th", { style: th, children: "Amount" }), (0, jsx_runtime_1.jsx)("th", { style: th, children: "Due Date" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: curr.promisesThisWeek.map((prom, idx) => ((0, jsx_runtime_1.jsxs)("tr", { style: tr, children: [(0, jsx_runtime_1.jsx)("td", { style: td, children: prom.clientName }), (0, jsx_runtime_1.jsx)("td", { style: td, children: prom.amount }), (0, jsx_runtime_1.jsx)("td", { style: td, children: prom.dueDate })] }, idx))) })] })] })), curr.paymentsReceived && curr.paymentsReceived.length > 0 && ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: section, children: [(0, jsx_runtime_1.jsx)(components_1.Heading, { style: sectionTitle, children: "Payments Received (Last 7 Days)" }), (0, jsx_runtime_1.jsxs)("table", { style: table, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { style: th, children: "Client" }), (0, jsx_runtime_1.jsx)("th", { style: th, children: "Amount" }), (0, jsx_runtime_1.jsx)("th", { style: th, children: "Date" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: curr.paymentsReceived.map((pay, idx) => ((0, jsx_runtime_1.jsxs)("tr", { style: tr, children: [(0, jsx_runtime_1.jsx)("td", { style: td, children: pay.clientName }), (0, jsx_runtime_1.jsx)("td", { style: { ...td, color: '#10b981' }, children: pay.amount }), (0, jsx_runtime_1.jsx)("td", { style: td, children: pay.date })] }, idx))) })] })] })), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: hr })] }, cIdx))), (0, jsx_runtime_1.jsx)(components_1.Section, { style: ctaSection, children: (0, jsx_runtime_1.jsx)(components_1.Button, { href: "https://duely.in/dashboard", style: button, children: "View Full Dashboard" }) }), (0, jsx_runtime_1.jsx)(components_1.Section, { children: (0, jsx_runtime_1.jsx)(components_1.Text, { style: footerText, children: "You are receiving this because you have the Weekly Digest enabled in your Duely settings." }) })] }) })] }));
};
exports.WeeklyDigestEmail = WeeklyDigestEmail;
exports.default = exports.WeeklyDigestEmail;
/*
  ALWAYS LIGHT THEME
*/
const main = {
    backgroundColor: "#f4f4f5", // zinc-100
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
    color: "#18181b",
};
const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "40px 20px",
    borderRadius: "12px",
    maxWidth: "800px",
    border: "1px solid #e4e4e7", // zinc-200
};
const header = {
    paddingBottom: "20px",
    borderBottom: "1px solid #e4e4e7",
    marginBottom: "30px",
};
const logoText = {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#18181b",
    margin: "0 0 10px 0",
};
const currencyTitle = {
    fontSize: "20px",
    lineHeight: "1.3",
    fontWeight: "600",
    color: "#18181b",
    margin: "0 0 15px 0",
    paddingBottom: "10px",
    borderBottom: "2px solid #3b82f6",
    display: "inline-block",
};
const chartTitle = {
    fontSize: "14px",
    fontWeight: "600",
    color: "#18181b",
    margin: "0 0 5px 0",
    textAlign: "center",
};
const chartContainer = {
    padding: "10px",
    backgroundColor: "#ffffff", // white to match metrics cards
    border: "1px solid #e4e4e7", // light border
    borderRadius: "8px",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
};
const heading = {
    fontSize: "22px",
    lineHeight: "1.3",
    fontWeight: "600",
    color: "#18181b",
    margin: "0 0 5px 0",
};
const dateText = {
    fontSize: "14px",
    color: "#71717a", // zinc-500
    margin: "0",
};
const actionItemsSection = {
    backgroundColor: "rgba(59, 130, 246, 0.1)", // faint blue
    borderLeft: "4px solid #3b82f6", // blue-500
    padding: "15px",
    marginBottom: "30px",
    borderRadius: "0 8px 8px 0",
};
const actionList = {
    margin: 0,
    padding: 0,
    listStyle: "none",
};
const actionListItem = {
    color: "#1d4ed8", // blue-700
    fontSize: "14px",
    marginBottom: "6px",
};
const metricsSection = {
    marginBottom: "20px",
};
const metricCard = {
    padding: "15px",
    backgroundColor: "#ffffff", // white
    border: "1px solid #e4e4e7", // light border (zinc-200)
    borderRadius: "8px",
    marginRight: "10px",
    textAlign: "center",
    width: "33%",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", // subtle shadow
};
const metricLabel = {
    fontSize: "11px",
    textTransform: "uppercase",
    color: "#71717a", // zinc-500
    letterSpacing: "0.5px",
    margin: "0 0 5px 0",
};
const metricValue = {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#18181b", // zinc-900
    margin: "0",
};
const metricValueOverdue = {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#ef4444", // red-500
    margin: "0",
};
const section = {
    marginBottom: "30px",
};
const sectionTitle = {
    fontSize: "16px",
    fontWeight: "600",
    color: "#18181b",
    margin: "0 0 15px 0",
};
const table = {
    width: "100%",
    borderCollapse: "collapse",
};
const th = {
    textAlign: "left",
    padding: "10px",
    borderBottom: "1px solid #e4e4e7", // zinc-200
    color: "#71717a", // zinc-500
    fontSize: "12px",
    textTransform: "uppercase",
};
const tr = {
    borderBottom: "1px solid #f4f4f5", // zinc-100
};
const td = {
    padding: "12px 10px",
    color: "#3f3f46", // zinc-700
    fontSize: "14px",
};
const ctaSection = {
    textAlign: "center",
    marginTop: "40px",
    marginBottom: "30px",
};
const button = {
    backgroundColor: "#2563eb", // blue-600
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    textDecoration: "none",
    textAlign: "center",
    display: "inline-block",
    padding: "12px 24px",
    fontWeight: "600",
};
const hr = {
    borderColor: "#e4e4e7", // zinc-200
    margin: "20px 0",
};
const footerText = {
    color: "#a1a1aa", // zinc-400
    fontSize: "12px",
    textAlign: "center",
};
