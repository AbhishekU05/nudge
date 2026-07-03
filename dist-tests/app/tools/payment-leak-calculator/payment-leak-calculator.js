"use strict";
/* eslint-disable */
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentLeakCalculator = PaymentLeakCalculator;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const calculations_1 = require("@/lib/payment-leak-calculator/calculations");
const minimal_site_header_1 = require("@/components/site/minimal-site-header");
const utils_1 = require("@/lib/utils");
const initialInputs = {
    activeClients: 15,
    averageInvoiceValue: 3000,
    latePaymentPercentage: 20,
    monthlyOperatingExpenses: 30000,
    paymentDelayDays: 21,
};
function trackEvent(eventName, params) {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
    }
}
function PaymentLeakCalculator() {
    const [inputs, setInputs] = (0, react_1.useState)(initialInputs);
    const [name, setName] = (0, react_1.useState)("");
    const [email, setEmail] = (0, react_1.useState)("");
    const [status, setStatus] = (0, react_1.useState)("idle");
    const [error, setError] = (0, react_1.useState)("");
    const [copyStatus, setCopyStatus] = (0, react_1.useState)("idle");
    const [leadSource, setLeadSource] = (0, react_1.useState)({});
    const hasTrackedStart = (0, react_1.useRef)(false);
    const hasTrackedComplete = (0, react_1.useRef)(false);
    const results = (0, react_1.useMemo)(() => (0, calculations_1.calculatePaymentLeak)(inputs), [inputs]);
    const meaning = getMeaning(inputs, results);
    const biggestLeak = getBiggestLeak(results);
    const benchmarkInterpretation = getBenchmarkInterpretation(results.riskScore, results.annualImpact, results.cashTiedUp);
    const riskExplanation = getRiskExplanation(results.riskLevel);
    const dynamicCta = getDynamicCta(results.riskLevel, results.annualImpact);
    const shareUrl = (0, react_1.useMemo)(() => buildShareUrl(inputs), [inputs]);
    const recoveryOpportunity = (0, react_1.useMemo)(() => {
        const improvedDelay = Math.round(inputs.paymentDelayDays / 2);
        const improvedResults = (0, calculations_1.calculatePaymentLeak)({ ...inputs, paymentDelayDays: improvedDelay });
        return {
            currentDelay: inputs.paymentDelayDays,
            improvedDelay,
            potentialRecovery: results.annualImpact - improvedResults.annualImpact,
        };
    }, [inputs, results.annualImpact]);
    const shareText = `I just calculated that delayed payments could cost my agency ${(0, calculations_1.formatCurrency)(results.annualImpact)} over the next 12 months.\n\nCalculated using Duely's Payment Leak Estimator.`;
    const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    const benchmarkRows = [
        { label: "Healthy agency", score: calculations_1.BENCHMARKS.healthyAgency },
        { label: "Industry average", score: calculations_1.BENCHMARKS.averageAgency },
        { label: "High-risk agency", score: calculations_1.BENCHMARKS.highRiskAgency },
        { label: "Your agency", score: results.riskScore, strong: true },
    ];
    (0, react_1.useEffect)(() => {
        const params = new URLSearchParams(window.location.search);
        const nextInputs = { ...initialInputs };
        const mappings = [
            ["activeClients", "clients"],
            ["averageInvoiceValue", "invoice"],
            ["latePaymentPercentage", "late"],
            ["paymentDelayDays", "delay"],
            ["monthlyOperatingExpenses", "expenses"],
        ];
        mappings.forEach(([key, param]) => {
            const value = params.get(param);
            if (value !== null && value !== "") {
                nextInputs[key] = Number(value);
            }
        });
        // eslint-disable-next-line
        setLeadSource({
            source: params.get("source") || undefined,
            utm_source: params.get("utm_source") || undefined,
            utm_medium: params.get("utm_medium") || undefined,
            utm_campaign: params.get("utm_campaign") || undefined,
        });
        window.setTimeout(() => setInputs(nextInputs), 0);
    }, []);
    (0, react_1.useEffect)(() => {
        if (!hasTrackedStart.current || hasTrackedComplete.current)
            return;
        const timeout = window.setTimeout(() => {
            hasTrackedComplete.current = true;
            trackEvent("calculator_completed", {
                risk_level: results.riskLevel,
                risk_score: results.riskScore,
                annual_impact: results.annualImpact,
            });
        }, 2000);
        return () => window.clearTimeout(timeout);
    }, [inputs, results.riskLevel, results.riskScore, results.annualImpact]);
    function updateInput(key, value) {
        if (!hasTrackedStart.current) {
            hasTrackedStart.current = true;
            trackEvent("calculator_started");
        }
        setInputs((current) => ({
            ...current,
            [key]: value === "" ? null : Number(value),
        }));
        setStatus("idle");
    }
    async function submitReport(event) {
        event.preventDefault();
        setStatus("sending");
        setError("");
        trackEvent("report_requested", { risk_level: results.riskLevel });
        try {
            const response = await fetch("/api/payment-leak-calculator/report", {
                body: JSON.stringify({ email, inputs, name, ...leadSource }),
                headers: { "Content-Type": "application/json" },
                method: "POST",
            });
            const payload = (await response.json().catch(() => ({})));
            if (!response.ok) {
                setStatus("error");
                setError(payload.error ?? "Could not send the report. Please try again.");
                return;
            }
            setStatus("sent");
            trackEvent("report_sent", { risk_level: results.riskLevel });
        }
        catch {
            setStatus("error");
            setError("A network error occurred. Please check your connection and try again.");
        }
    }
    async function copyShareLink() {
        await navigator.clipboard.writeText(shareUrl);
        setCopyStatus("copied");
        trackEvent("copy_link_clicked");
        window.setTimeout(() => setCopyStatus("idle"), 1800);
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen overflow-x-hidden bg-background text-foreground", children: [(0, jsx_runtime_1.jsx)(minimal_site_header_1.MinimalSiteHeader, {}), (0, jsx_runtime_1.jsxs)("main", { id: "main-content", children: [(0, jsx_runtime_1.jsx)("section", { className: "border-b border-white/10 py-10 sm:py-14 lg:py-16", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col justify-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300", children: "Agency Payment Leak Estimator" }), (0, jsx_runtime_1.jsx)("h1", { className: "mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl", children: "Find the cash flow stuck inside delayed client payments." }), (0, jsx_runtime_1.jsx)("p", { className: "mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg", children: "Estimate how much working capital is tied up in late invoices, see your collections risk score, and get a personalized Duely report." })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/10 bg-white/[0.03]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Estimator Inputs" }) }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 sm:grid-cols-2", children: [(0, jsx_runtime_1.jsx)(NumberField, { label: "Number of active clients", min: 1, value: inputs.activeClients, onChange: (value) => updateInput("activeClients", value) }), (0, jsx_runtime_1.jsx)(NumberField, { label: "Average monthly invoice value", min: 0, prefix: "USD", value: inputs.averageInvoiceValue, onChange: (value) => updateInput("averageInvoiceValue", value) }), (0, jsx_runtime_1.jsx)(NumberField, { label: "Percentage of invoices paid late", max: 100, min: 0, suffix: "%", value: inputs.latePaymentPercentage, onChange: (value) => updateInput("latePaymentPercentage", value) }), (0, jsx_runtime_1.jsx)(NumberField, { label: "Average payment delay", max: 180, min: 0, suffix: "days", value: inputs.paymentDelayDays, onChange: (value) => updateInput("paymentDelayDays", value) }), (0, jsx_runtime_1.jsx)("div", { className: "sm:col-span-2", children: (0, jsx_runtime_1.jsx)(NumberField, { label: "Monthly operating expenses", min: 0, optional: true, prefix: "USD", value: inputs.monthlyOperatingExpenses ?? "", onChange: (value) => updateInput("monthlyOperatingExpenses", value) }) })] }) })] })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "py-8 sm:py-10", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-emerald-300/20 bg-emerald-300/[0.06] md:col-span-2 xl:col-span-1", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { className: "pb-2", children: (0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2 text-sm text-zinc-300", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-emerald-300", children: (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "h-5 w-5" }) }), "Annualized Cash Flow Impact"] }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl", children: (0, calculations_1.formatCurrency)(results.annualImpact) }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-emerald-200", children: "If current delays persist for 12 months" })] })] }), (0, jsx_runtime_1.jsx)(MetricCard, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { className: "h-5 w-5" }), label: "Cash Currently Outstanding", value: (0, calculations_1.formatCurrency)(results.cashTiedUp), note: "Sitting outside your business today" }), (0, jsx_runtime_1.jsx)(MetricCard, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Gauge, { className: "h-5 w-5" }), label: "Collections Risk Score", value: `${results.riskScore}/100`, note: `${results.riskLevel} risk` }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/10 bg-white/[0.03]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { className: "pb-2", children: (0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2 text-sm text-zinc-300", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { className: "h-5 w-5 text-amber-300" }), "Recommended Actions"] }) }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("ul", { className: "space-y-2", children: results.recommendations.map((recommendation) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex gap-2 text-sm text-zinc-300", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "mt-0.5 h-4 w-4 shrink-0 text-emerald-300" }), recommendation] }, recommendation))) }) })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "mt-6 border-sky-300/20 bg-sky-300/[0.06]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "h-5 w-5 text-sky-300" }), "Recovery Opportunity"] }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid gap-6 sm:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("p", { className: "flex items-center gap-2 text-sm text-zinc-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-4 w-4" }), "Current delay"] }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-2xl font-semibold text-zinc-50", children: [recoveryOpportunity.currentDelay, " days"] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("p", { className: "flex items-center gap-2 text-sm text-zinc-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-4 w-4" }), "Improved delay"] }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-2xl font-semibold text-emerald-300", children: [recoveryOpportunity.improvedDelay, " days"] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("p", { className: "flex items-center gap-2 text-sm text-zinc-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "h-4 w-4" }), "Potential recovery"] }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-2xl font-bold text-sky-300", children: [(0, calculations_1.formatCurrency)(recoveryOpportunity.potentialRecovery), "/year"] })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-5 rounded-lg border border-sky-300/10 bg-sky-300/[0.04] p-3 text-sm leading-6 text-zinc-300", children: "If your agency cut payment delays in half, this much working capital could return to the business." })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-emerald-300/20 bg-emerald-300/[0.06]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "What This Means" }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-xl font-semibold leading-7 text-zinc-50", children: ["You currently have ", (0, calculations_1.formatCurrency)(results.cashTiedUp), " sitting outside your business."] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm leading-6 text-zinc-300", children: meaning.operatingExpenses }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm leading-6 text-zinc-300", children: ["This equals about ", meaning.averageRetainers, " average client retainers and ", meaning.payrollWeeks, " weeks of payroll."] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-medium leading-6 text-emerald-200", children: ["This amount compounds to ", (0, calculations_1.formatCurrency)(results.annualImpact), " annually."] })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/10 bg-white/[0.03]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Biggest Contributor To Your Risk" }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-xl font-semibold leading-7 text-zinc-50", children: [biggestLeak.label, " contributes ", biggestLeak.percent, "% of your risk score."] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-6 text-zinc-400", children: biggestLeak.explanation })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/10 bg-white/[0.03]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Risk Gauge" }) }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)(RiskGauge, { explanation: riskExplanation, level: results.riskLevel, score: results.riskScore }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/10 bg-white/[0.03]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BarChart3, { className: "h-5 w-5 text-sky-300" }), "Annual Impact"] }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsxs)("p", { className: "mb-5 text-sm font-medium leading-6 text-zinc-200", children: ["If nothing changes, delayed payments could impact approximately ", (0, calculations_1.formatCurrency)(results.annualImpact), " over the next 12 months."] }), (0, jsx_runtime_1.jsx)(ImpactChart, { annualImpact: results.annualImpact, cashTiedUp: results.cashTiedUp })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 grid gap-6 lg:grid-cols-3", children: [(0, jsx_runtime_1.jsx)(BreakdownCard, { label: "Late payment percentage", score: results.latePaymentScore, total: 50 }), (0, jsx_runtime_1.jsx)(BreakdownCard, { label: "Delay days", score: results.delayDaysScore, total: 30 }), (0, jsx_runtime_1.jsx)(BreakdownCard, { label: "Client concentration", score: results.clientConcentrationScore, total: 20 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/10 bg-white/[0.03]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Benchmark Comparison" }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-zinc-200", children: benchmarkInterpretation }), benchmarkRows.map((row) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-2 flex items-center justify-between gap-3 text-sm", children: [(0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)("text-zinc-400", row.strong && "font-semibold text-zinc-50"), children: row.label }), (0, jsx_runtime_1.jsxs)("span", { className: "font-medium text-zinc-200", children: [row.score, "/100"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-2 rounded-full bg-white/10", children: (0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("h-2 rounded-full", row.strong ? "bg-emerald-300" : "bg-zinc-500"), style: { width: `${row.score}%` } }) })] }, row.label)))] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/10 bg-white/[0.03]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Operating Expense Context" }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-3xl font-semibold text-zinc-50", children: results.operatingExpenseCoverage
                                                                ? `${(results.operatingExpenseCoverage * 100).toFixed(0)}%`
                                                                : "Add expenses" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-6 text-zinc-400", children: results.operatingExpenseCoverage
                                                                ? "of one month of operating expenses is currently tied up in delayed payments."
                                                                : "Enter monthly operating expenses to see how much runway is caught in late invoices." })] })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "mt-6 border-white/10 bg-white/[0.03]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: "Share Your Result" }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("p", { className: "rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-zinc-200", children: ["I just calculated that delayed payments could cost my agency ", (0, calculations_1.formatCurrency)(results.annualImpact), " over the next 12 months.", (0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsx)("br", {}), "Calculated using Duely's Payment Leak Estimator."] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-3 sm:flex-row", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: xShareUrl, target: "_blank", rel: "noreferrer", onClick: () => trackEvent("share_clicked", { platform: "x" }), children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "secondary", className: "w-full sm:w-auto", children: "Share on X" }) }), (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "button", variant: "secondary", className: "w-full sm:w-auto", onClick: copyShareLink, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Copy, { className: "h-4 w-4" }), copyStatus === "copied" ? "Copied" : "Copy link"] })] })] })] })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "border-y border-white/10 bg-white/[0.025] py-12", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-sky-300", children: "Get Your Full Collections Report" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-4 text-3xl font-semibold tracking-tight text-zinc-50", children: "Get Your Personalized Collections Report" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 max-w-2xl text-sm leading-6 text-zinc-400", children: "The report contains additional insights beyond what is shown on this page." }), (0, jsx_runtime_1.jsx)("ul", { className: "mt-5 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2", children: [
                                                "Full risk breakdown",
                                                "Benchmark comparison",
                                                "Biggest leak analysis",
                                                "Recommended action plan",
                                                "PDF copy for future reference",
                                            ].map((item) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "mt-0.5 h-4 w-4 shrink-0 text-emerald-300" }), item] }, item))) })] }), status === "sent" ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] p-8 text-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-8 w-8 text-emerald-300" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-lg font-semibold text-zinc-50", children: "Your personalized collections report has been emailed." }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 max-w-md text-sm leading-6 text-zinc-300", children: "Check your inbox for the PDF report and save it for your next collections review." })] })) : ((0, jsx_runtime_1.jsxs)("form", { onSubmit: submitReport, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 sm:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "report-name", children: "Name" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "report-name", autoComplete: "name", required: true, value: name, onChange: (event) => setName(event.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "report-email", children: "Email" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "report-email", autoComplete: "email", required: true, type: "email", value: email, onChange: (event) => setEmail(event.target.value) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-3 sm:flex-row", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", size: "lg", className: "w-full sm:w-auto", disabled: status === "sending", children: [status === "sending" ? ((0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "h-4 w-4 animate-spin" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-4 w-4" })), status === "sending" ? "Generating report..." : "Email My Report"] }), status === "error" && ((0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", variant: "secondary", size: "lg", children: "Retry" }))] }), status === "error" && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm leading-6 text-red-300", children: error }))] }))] }) }), (0, jsx_runtime_1.jsx)("section", { className: "py-14", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:px-8", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300", children: dynamicCta.eyebrow }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "max-w-2xl text-3xl font-semibold tracking-tight text-zinc-50", children: dynamicCta.headline }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 max-w-2xl text-base leading-7 text-zinc-400", children: dynamicCta.body })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/signup", onClick: () => trackEvent("trial_clicked", { risk_level: results.riskLevel }), children: (0, jsx_runtime_1.jsxs)(button_1.Button, { size: "lg", className: "w-full sm:w-auto", children: ["Start Free Trial", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4" })] }) })] })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "border-t border-white/10 bg-white/[0.015] py-12", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 text-center sm:px-6 lg:px-8", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-sky-300", children: "Related Tool" }), (0, jsx_runtime_1.jsx)("p", { className: "max-w-xl text-base leading-7 text-zinc-400", children: "Want to evaluate the systems behind your collections process?" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/tools/collections-maturity-assessment", className: "w-full sm:w-auto", children: (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "secondary", size: "lg", className: "w-full sm:w-auto", children: ["Take the Collections Maturity Assessment", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4" })] }) })] }) })] })] }));
}
function NumberField({ label, max, min, onChange, optional, prefix, suffix, value, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)(label_1.Label, { children: [label, optional && (0, jsx_runtime_1.jsx)("span", { className: "text-zinc-500", children: " (optional)" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex rounded-lg border border-border bg-white/[0.04] focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring", children: [prefix && ((0, jsx_runtime_1.jsx)("span", { className: "flex items-center px-3 text-xs font-semibold uppercase text-zinc-500", children: prefix })), (0, jsx_runtime_1.jsx)("input", { className: "h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600", max: max, min: min, type: "number", value: value, onChange: (event) => onChange(event.target.value) }), suffix && ((0, jsx_runtime_1.jsx)("span", { className: "flex items-center px-3 text-xs font-semibold uppercase text-zinc-500", children: suffix }))] })] }));
}
function MetricCard({ icon, label, note, value, }) {
    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/10 bg-white/[0.03]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { className: "pb-2", children: (0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2 text-sm text-zinc-300", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-emerald-300", children: icon }), label] }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-semibold tracking-tight text-zinc-50", children: value }), note && (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-amber-300", children: note })] })] }));
}
function RiskGauge({ explanation, level, score, }) {
    const rotation = -90 + (score / 100) * 180;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative aspect-[2/1] overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-full rounded-t-full border-[18px] border-b-0 border-white/10" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-full rounded-t-full border-[18px] border-b-0 border-emerald-300 [clip-path:inset(0_50%_0_0)]" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-full rounded-t-full border-[18px] border-b-0 border-amber-300 [clip-path:inset(0_25%_0_50%)]" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-full rounded-t-full border-[18px] border-b-0 border-red-300 [clip-path:inset(0_0_0_75%)]" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-0 left-1/2 h-1 w-[42%] origin-left rounded-full bg-zinc-50 transition-transform", style: { transform: `rotate(${rotation}deg)` } }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-zinc-50" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4 text-center", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-4xl font-semibold text-zinc-50", children: [score, "/100"] }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-2 text-sm font-medium text-amber-300", children: [level, " risk"] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm leading-6 text-zinc-400", children: explanation })] })] }));
}
function ImpactChart({ annualImpact, cashTiedUp, }) {
    const bars = [
        { label: "1 month", value: cashTiedUp },
        { label: "3 months", value: cashTiedUp * 3 },
        { label: "12 months", value: annualImpact },
    ];
    const max = Math.max(...bars.map((bar) => bar.value), 1);
    return ((0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: bars.map((bar) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-2 flex items-center justify-between gap-3 text-sm", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-zinc-400", children: bar.label }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium text-zinc-200", children: (0, calculations_1.formatCurrency)(bar.value) })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-9 rounded-lg bg-white/10", children: (0, jsx_runtime_1.jsx)("div", { className: "flex h-9 min-w-10 items-center justify-end rounded-lg bg-sky-400 pr-2 text-xs font-semibold text-zinc-950", style: { width: `${Math.max((bar.value / max) * 100, 8)}%` }, children: (0, calculations_1.formatNumber)(bar.value) }) })] }, bar.label))) }));
}
function BreakdownCard({ label, score, total, }) {
    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/10 bg-white/[0.03]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { className: "pb-2", children: (0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-sm text-zinc-300", children: label }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-2xl font-semibold text-zinc-50", children: [score.toFixed(1), "/", total] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4 h-2 rounded-full bg-white/10", children: (0, jsx_runtime_1.jsx)("div", { className: "h-2 rounded-full bg-amber-300", style: { width: `${(score / total) * 100}%` } }) })] })] }));
}
function getMeaning(inputs, results) {
    const monthlyExpenses = inputs.monthlyOperatingExpenses && inputs.monthlyOperatingExpenses > 0
        ? inputs.monthlyOperatingExpenses
        : null;
    const payrollEstimate = monthlyExpenses ? monthlyExpenses * 0.6 : inputs.activeClients * 1800;
    const months = monthlyExpenses ? results.cashTiedUp / monthlyExpenses : null;
    const retainers = inputs.averageInvoiceValue > 0 ? results.cashTiedUp / inputs.averageInvoiceValue : 0;
    const payrollWeeks = payrollEstimate > 0 ? results.cashTiedUp / (payrollEstimate / 4.33) : 0;
    return {
        averageRetainers: retainers.toFixed(1),
        operatingExpenses: months
            ? `This is equivalent to ${months.toFixed(1)} months of operating expenses.`
            : "Add operating expenses to translate this into runway.",
        payrollWeeks: payrollWeeks.toFixed(1),
    };
}
function getBiggestLeak(results) {
    const contributors = [
        {
            explanation: "Too many invoices are entering collections instead of arriving on time. Reducing late payment frequency lowers risk before reminders are even needed.",
            label: "Late payment percentage",
            value: results.latePaymentScore,
        },
        {
            explanation: "Payment delays are stretching cash conversion after invoices are already late. This is your largest collections bottleneck.",
            label: "Average payment delay",
            value: results.delayDaysScore,
        },
        {
            explanation: "A smaller client base makes each delayed payment matter more. One slow payer can create an outsized cash-flow gap.",
            label: "Client concentration",
            value: results.clientConcentrationScore,
        },
    ];
    const biggest = contributors.reduce((current, next) => next.value > current.value ? next : current);
    const total = Math.max(results.riskScore, 1);
    return {
        ...biggest,
        percent: Math.round((biggest.value / total) * 100),
    };
}
function getBenchmarkInterpretation(score, annualImpact, cashTiedUp) {
    if (score < calculations_1.BENCHMARKS.averageAgency) {
        return `Your collections process is healthier than the average agency. However, delayed payments could still keep ${(0, calculations_1.formatCurrency)(annualImpact)} outside your business over the next year.`;
    }
    if (score >= calculations_1.BENCHMARKS.highRiskAgency) {
        return `Delayed payments are creating meaningful cash-flow risk. Agencies at this level often struggle with forecasting and follow-up consistency. You currently have ${(0, calculations_1.formatCurrency)(cashTiedUp)} sitting outside your business.`;
    }
    return `Your collections process is around the industry average. Small improvements in follow-up consistency could unlock significant cash flow — currently ${(0, calculations_1.formatCurrency)(cashTiedUp)} is outstanding.`;
}
function getRiskExplanation(level) {
    if (level === "High") {
        return "High-risk agencies often have visible cash-flow drag, repeated overdue invoices, and payment promises that need active escalation. The next step is to automate follow-ups and track every commitment.";
    }
    if (level === "Medium") {
        return "Medium-risk agencies usually collect eventually, but follow-up inconsistency creates avoidable delays. The next step is to track payment promises and standardize reminders.";
    }
    return "Low-risk agencies typically have predictable cash flow and fewer overdue invoices. The next step is to keep monitoring this as client count and invoice volume grow.";
}
function getDynamicCta(level, annualImpact) {
    if (level === "High") {
        return {
            body: "Duely helps recover cash faster through automated collections workflows.",
            eyebrow: "Stop Losing Working Capital",
            headline: `Your agency could be losing ${(0, calculations_1.formatCurrency)(annualImpact)} in working capital to delayed payments.`,
        };
    }
    if (level === "Medium") {
        return {
            body: "Duely automatically tracks promises, reminders, and follow-ups so invoices don\u2019t fall through the cracks.",
            eyebrow: "Tighten Follow-Up Before It Slips",
            headline: "Your biggest risk is inconsistent payment collection.",
        };
    }
    return {
        body: "As your client count grows, keeping track of payment promises manually becomes harder. Duely helps maintain this performance automatically.",
        eyebrow: "Maintain Collections Discipline",
        headline: "Your collections process is healthier than average.",
    };
}
function buildShareUrl(inputs) {
    const url = new URL("https://duely.in/tools/payment-leak-calculator");
    url.search = "";
    url.searchParams.set("clients", String(inputs.activeClients));
    url.searchParams.set("invoice", String(inputs.averageInvoiceValue));
    url.searchParams.set("late", String(inputs.latePaymentPercentage));
    url.searchParams.set("delay", String(inputs.paymentDelayDays));
    if (inputs.monthlyOperatingExpenses) {
        url.searchParams.set("expenses", String(inputs.monthlyOperatingExpenses));
    }
    return url.toString();
}
