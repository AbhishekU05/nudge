"use strict";
/* eslint-disable */
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionsMaturityAssessment = CollectionsMaturityAssessment;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const calculations_1 = require("@/lib/collections-maturity/calculations");
const minimal_site_header_1 = require("@/components/site/minimal-site-header");
const utils_1 = require("@/lib/utils");
const CATEGORIES = [
    { key: "followUpDiscipline", label: "Follow-Up Discipline", questions: calculations_1.QUESTIONS.filter((q) => q.category === "followUpDiscipline") },
    { key: "promiseTracking", label: "Payment Promise Tracking", questions: calculations_1.QUESTIONS.filter((q) => q.category === "promiseTracking") },
    { key: "visibility", label: "Visibility & Reporting", questions: calculations_1.QUESTIONS.filter((q) => q.category === "visibility") },
    { key: "automation", label: "Automation", questions: calculations_1.QUESTIONS.filter((q) => q.category === "automation") },
];
function trackEvent(eventName, params) {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
    }
}
function CollectionsMaturityAssessment() {
    const [answers, setAnswers] = (0, react_1.useState)({});
    const [currentCategory, setCurrentCategory] = (0, react_1.useState)(0);
    const [showResults, setShowResults] = (0, react_1.useState)(false);
    const [name, setName] = (0, react_1.useState)("");
    const [email, setEmail] = (0, react_1.useState)("");
    const [status, setStatus] = (0, react_1.useState)("idle");
    const [error, setError] = (0, react_1.useState)("");
    const [leadSource, setLeadSource] = (0, react_1.useState)({});
    const hasTrackedStart = (0, react_1.useRef)(false);
    const results = (0, react_1.useMemo)(() => {
        if (!showResults)
            return null;
        return (0, calculations_1.calculateMaturity)(answers);
    }, [answers, showResults]);
    const allAnswered = calculations_1.QUESTIONS.every((q) => answers[q.id] !== undefined);
    const categoryAnswered = CATEGORIES[currentCategory].questions.every((q) => answers[q.id] !== undefined);
    (0, react_1.useEffect)(() => {
        const params = new URLSearchParams(window.location.search);
        // eslint-disable-next-line
        setLeadSource({
            source: params.get("source") || undefined,
            utm_source: params.get("utm_source") || undefined,
            utm_medium: params.get("utm_medium") || undefined,
            utm_campaign: params.get("utm_campaign") || undefined,
        });
    }, []);
    function setAnswer(questionId, value) {
        if (!hasTrackedStart.current) {
            hasTrackedStart.current = true;
            trackEvent("assessment_started");
        }
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    }
    function handleComplete() {
        if (!allAnswered)
            return;
        setShowResults(true);
        const r = (0, calculations_1.calculateMaturity)(answers);
        trackEvent("assessment_completed", {
            overall_score: r.overallScore,
            level: r.level,
            weakest_category: r.weakest.label,
            strongest_category: r.strongest.label,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    async function submitReport(event) {
        event.preventDefault();
        setStatus("sending");
        setError("");
        trackEvent("report_requested", { tool: "collections_maturity" });
        try {
            const response = await fetch("/api/collections-maturity-assessment/report", {
                body: JSON.stringify({ email, answers, name, ...leadSource }),
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
            trackEvent("report_sent", { tool: "collections_maturity" });
        }
        catch {
            setStatus("error");
            setError("A network error occurred. Please check your connection and try again.");
        }
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen overflow-x-hidden bg-background text-foreground", children: [(0, jsx_runtime_1.jsx)(minimal_site_header_1.MinimalSiteHeader, {}), (0, jsx_runtime_1.jsx)("main", { id: "main-content", children: !showResults ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("section", { className: "border-b border-white/10 py-10 sm:py-14 lg:py-16", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300", children: "Collections Maturity Assessment" }), (0, jsx_runtime_1.jsx)("h1", { className: "mt-5 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl", children: "How mature is your collections process?" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg", children: "Answer 20 questions across 4 categories. Get a personalized maturity score, category breakdown, and improvement recommendations." }), (0, jsx_runtime_1.jsx)("div", { className: "mt-8 flex items-center gap-2", children: CATEGORIES.map((cat, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("h-1.5 rounded-full transition-colors", i < currentCategory ? "bg-emerald-400" :
                                                        i === currentCategory ? "bg-emerald-300/60" : "bg-white/10") }), (0, jsx_runtime_1.jsx)("p", { className: (0, utils_1.cn)("mt-2 text-xs font-medium", i <= currentCategory ? "text-zinc-300" : "text-zinc-600"), children: cat.label })] }, cat.key))) })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "py-8 sm:py-10", children: (0, jsx_runtime_1.jsx)("div", { className: "mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/10 bg-white/[0.03]", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-300/10 text-sm font-bold text-emerald-300", children: currentCategory + 1 }), CATEGORIES[currentCategory].label] }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-sm text-zinc-500", children: [currentCategory + 1, " of ", CATEGORIES.length, " categories \u00B7 ", CATEGORIES[currentCategory].questions.length, " questions"] })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-6", children: [CATEGORIES[currentCategory].questions.map((question, qi) => ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-medium leading-6 text-zinc-200", children: [currentCategory * 5 + qi + 1, ". ", question.text] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-3 gap-2 sm:grid-cols-6", children: calculations_1.SCALE_LABELS.map((label, value) => ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setAnswer(question.id, value), className: (0, utils_1.cn)("rounded-lg border px-2 py-2 text-xs font-medium transition-colors", answers[question.id] === value
                                                                    ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-200"
                                                                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"), children: label }, value))) })] }, question.id))), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-3 pt-4", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { type: "button", variant: "secondary", disabled: currentCategory === 0, onClick: () => setCurrentCategory((c) => c - 1), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ChevronLeft, { className: "h-4 w-4" }), "Previous"] }), currentCategory < CATEGORIES.length - 1 ? ((0, jsx_runtime_1.jsxs)(button_1.Button, { type: "button", disabled: !categoryAnswered, onClick: () => {
                                                                setCurrentCategory((c) => c + 1);
                                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                                            }, children: ["Next Category", (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: "h-4 w-4" })] })) : ((0, jsx_runtime_1.jsxs)(button_1.Button, { type: "button", disabled: !allAnswered, onClick: handleComplete, children: ["See My Results", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4" })] }))] })] })] }) }) })] })) : results ? ((0, jsx_runtime_1.jsx)(ResultsDashboard, { results: results, name: name, email: email, status: status, error: error, onNameChange: setName, onEmailChange: setEmail, onSubmitReport: submitReport })) : null })] }));
}
function ResultsDashboard({ results, name, email, status, error, onNameChange, onEmailChange, onSubmitReport, }) {
    const positioning = (0, calculations_1.getDuelyPositioning)(results.weakest.key);
    const levelColor = getLevelColor(results.level);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("section", { className: "border-b border-white/10 py-12 sm:py-16", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto flex w-full max-w-3xl flex-col items-center px-4 text-center sm:px-6 lg:px-8", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300", children: "Your Assessment Results" }), (0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("mt-8 flex h-40 w-40 items-center justify-center rounded-full border-4", levelColor.border, levelColor.bg), children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: (0, utils_1.cn)("text-5xl font-bold tracking-tight", levelColor.text), children: results.overallScore }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-zinc-400", children: "/100" })] }) }), (0, jsx_runtime_1.jsx)("h1", { className: (0, utils_1.cn)("mt-6 text-3xl font-semibold tracking-tight sm:text-4xl", levelColor.text), children: results.level }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 max-w-lg text-base leading-7 text-zinc-400", children: results.levelDescription })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "py-8 sm:py-10", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/10 bg-white/[0.03]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BarChart3, { className: "h-5 w-5 text-sky-300" }), "Category Scores"] }) }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "space-y-5", children: results.categories.map((cat) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-2 flex items-center justify-between gap-3 text-sm", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium text-zinc-200", children: cat.label }), (0, jsx_runtime_1.jsxs)("span", { className: "font-semibold text-zinc-100", children: [cat.percentage, "%"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-3 rounded-full bg-white/10", children: (0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)("h-3 rounded-full transition-all", cat.percentage >= 80 ? "bg-emerald-400" :
                                                        cat.percentage >= 50 ? "bg-amber-300" : "bg-red-400"), style: { width: `${Math.max(cat.percentage, 3)}%` } }) })] }, cat.key))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 grid gap-6 lg:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-red-400/20 bg-red-400/[0.04]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2 text-red-300", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { className: "h-5 w-5" }), "Weakest Area"] }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xl font-semibold text-zinc-50", children: results.weakest.label }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-2xl font-bold text-red-300", children: [results.weakest.percentage, "%"] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-6 text-zinc-400", children: (0, calculations_1.getWeakestExplanation)(results.weakest.key) })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-emerald-400/20 bg-emerald-400/[0.04]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2 text-emerald-300", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "h-5 w-5" }), "Strongest Area"] }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xl font-semibold text-zinc-50", children: results.strongest.label }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-2xl font-bold text-emerald-300", children: [results.strongest.percentage, "%"] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-6 text-zinc-400", children: (0, calculations_1.getStrongestExplanation)(results.strongest.key) })] })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "mt-6 border-amber-300/20 bg-amber-300/[0.04]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Target, { className: "h-5 w-5 text-amber-300" }), "Improvement Opportunity"] }) }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { children: [(0, jsx_runtime_1.jsx)("p", { className: "mb-4 text-sm leading-6 text-zinc-300", children: "Organizations with lower collections maturity often experience:" }), (0, jsx_runtime_1.jsx)("ul", { className: "grid gap-2 text-sm text-zinc-400 sm:grid-cols-2", children: [
                                                "More overdue invoices",
                                                "Longer payment cycles",
                                                "Less predictable cash flow",
                                                "Higher administrative effort",
                                                "Greater reliance on manual follow-up",
                                            ].map((item) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { className: "mt-0.5 h-4 w-4 shrink-0 text-amber-300" }), item] }, item))) })] })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "mt-6 border-white/10 bg-white/[0.03]", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsxs)(card_1.CardTitle, { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "h-5 w-5 text-sky-300" }), "Personalized Recommendations"] }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-sm text-zinc-500", children: ["Based on your weakest category: ", results.weakest.label] })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: (0, jsx_runtime_1.jsx)("ul", { className: "space-y-3", children: results.recommendations.map((rec) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex gap-2 text-sm text-zinc-300", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "mt-0.5 h-4 w-4 shrink-0 text-emerald-300" }), rec] }, rec))) }) })] })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "border-y border-white/10 bg-white/[0.025] py-12", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto grid w-full max-w-4xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-sky-300", children: "Get Your Collections Maturity Report" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-4 text-3xl font-semibold tracking-tight text-zinc-50", children: "Get Your Personalized Maturity Report" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 max-w-2xl text-sm leading-6 text-zinc-400", children: "Receive a PDF version of your assessment plus a personalized improvement roadmap." }), (0, jsx_runtime_1.jsx)("ul", { className: "mt-5 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2", children: [
                                        "Overall score & maturity level",
                                        "Category breakdown",
                                        "Weakest area analysis",
                                        "Personalized recommendations",
                                        "30-day improvement roadmap",
                                    ].map((item) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "mt-0.5 h-4 w-4 shrink-0 text-emerald-300" }), item] }, item))) })] }), status === "sent" ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] p-8 text-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-8 w-8 text-emerald-300" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-lg font-semibold text-zinc-50", children: "Your personalized collections maturity report has been emailed." }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 max-w-md text-sm leading-6 text-zinc-300", children: "Check your inbox for the PDF report and improvement roadmap." })] })) : ((0, jsx_runtime_1.jsxs)("form", { onSubmit: onSubmitReport, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 sm:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "report-name", children: "Name" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "report-name", autoComplete: "name", required: true, value: name, onChange: (e) => onNameChange(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "report-email", children: "Email" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "report-email", autoComplete: "email", required: true, type: "email", value: email, onChange: (e) => onEmailChange(e.target.value) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-3 sm:flex-row", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { type: "submit", size: "lg", className: "w-full sm:w-auto", disabled: status === "sending", children: [status === "sending" ? (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "h-4 w-4 animate-spin" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-4 w-4" }), status === "sending" ? "Generating report..." : "Email My Report"] }), status === "error" && ((0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", variant: "secondary", size: "lg", children: "Retry" }))] }), status === "error" && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm leading-6 text-red-300", children: error }))] }))] }) }), (0, jsx_runtime_1.jsx)("section", { className: "py-14", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 sm:px-6 lg:px-8", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300", children: "Solve This With Duely" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "max-w-2xl text-3xl font-semibold tracking-tight text-zinc-50", children: positioning.headline }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 max-w-2xl text-base leading-7 text-zinc-400", children: positioning.body })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/signup", onClick: () => trackEvent("trial_clicked", { tool: "collections_maturity", weakest: results.weakest.label }), children: (0, jsx_runtime_1.jsxs)(button_1.Button, { size: "lg", className: "w-full sm:w-auto", children: ["Start Free Trial", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4" })] }) })] })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "border-t border-white/10 bg-white/[0.015] py-12", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 text-center sm:px-6 lg:px-8", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-sky-300", children: "Related Tool" }), (0, jsx_runtime_1.jsx)("p", { className: "max-w-xl text-base leading-7 text-zinc-400", children: "Want to estimate the financial impact of delayed payments?" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/tools/payment-leak-calculator", className: "w-full sm:w-auto", children: (0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "secondary", size: "lg", className: "w-full sm:w-auto", children: ["Use the Payment Leak Estimator", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4" })] }) })] }) })] }));
}
function getLevelColor(level) {
    switch (level) {
        case "Top Quartile":
            return {
                border: "border-emerald-400",
                bg: "bg-emerald-400/10",
                text: "text-emerald-300",
            };
        case "Operationally Strong":
            return {
                border: "border-sky-400",
                bg: "bg-sky-400/10",
                text: "text-sky-300",
            };
        case "Growing Agency":
            return {
                border: "border-amber-400",
                bg: "bg-amber-400/10",
                text: "text-amber-300",
            };
        default:
            return {
                border: "border-red-400",
                bg: "bg-red-400/10",
                text: "text-red-300",
            };
    }
}
