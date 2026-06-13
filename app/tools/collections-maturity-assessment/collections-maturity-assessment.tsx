"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  RefreshCw,
  ShieldAlert,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateMaturity,
  getDuelyPositioning,
  getStrongestExplanation,
  getWeakestExplanation,
  QUESTIONS,
  SCALE_LABELS,
  type MaturityInputs,
  type MaturityResults,
} from "@/lib/collections-maturity/calculations";
import { MinimalSiteHeader } from "@/components/site/minimal-site-header";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "followUpDiscipline", label: "Follow-Up Discipline", questions: QUESTIONS.filter((q) => q.category === "followUpDiscipline") },
  { key: "promiseTracking", label: "Payment Promise Tracking", questions: QUESTIONS.filter((q) => q.category === "promiseTracking") },
  { key: "visibility", label: "Visibility & Reporting", questions: QUESTIONS.filter((q) => q.category === "visibility") },
  { key: "automation", label: "Automation", questions: QUESTIONS.filter((q) => q.category === "automation") },
];

function trackEvent(eventName: string, params?: Record<string, string | number>) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", eventName, params);
  }
}

export function CollectionsMaturityAssessment() {
  const [answers, setAnswers] = useState<MaturityInputs>({});
  const [currentCategory, setCurrentCategory] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [leadSource, setLeadSource] = useState<{
    source?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>({});
  const hasTrackedStart = useRef(false);

  const results = useMemo(() => {
    if (!showResults) return null;
    return calculateMaturity(answers);
  }, [answers, showResults]);

  const allAnswered = QUESTIONS.every((q) => answers[q.id] !== undefined);
  const categoryAnswered = CATEGORIES[currentCategory].questions.every(
    (q) => answers[q.id] !== undefined,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLeadSource({
      source: params.get("source") || undefined,
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
    });
  }, []);

  function setAnswer(questionId: string, value: number) {
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackEvent("assessment_started");
    }
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleComplete() {
    if (!allAnswered) return;
    setShowResults(true);
    const r = calculateMaturity(answers);
    trackEvent("assessment_completed", {
      overall_score: r.overallScore,
      level: r.level,
      weakest_category: r.weakest.label,
      strongest_category: r.strongest.label,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
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

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setStatus("error");
        setError(payload.error ?? "Could not send the report. Please try again.");
        return;
      }

      setStatus("sent");
      trackEvent("report_sent", { tool: "collections_maturity" });
    } catch {
      setStatus("error");
      setError("A network error occurred. Please check your connection and try again.");
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <MinimalSiteHeader />

      <main>
        {!showResults ? (
          <>
            <section className="border-b border-white/10 py-10 sm:py-14 lg:py-16">
              <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Collections Maturity Assessment
                </p>
                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
                  How mature is your collections process?
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                  Answer 20 questions across 4 categories. Get a personalized maturity score, category breakdown, and improvement recommendations.
                </p>

                {/* Progress */}
                <div className="mt-8 flex items-center gap-2">
                  {CATEGORIES.map((cat, i) => (
                    <div key={cat.key} className="flex-1">
                      <div className={cn(
                        "h-1.5 rounded-full transition-colors",
                        i < currentCategory ? "bg-emerald-400" :
                        i === currentCategory ? "bg-emerald-300/60" : "bg-white/10",
                      )} />
                      <p className={cn(
                        "mt-2 text-xs font-medium",
                        i <= currentCategory ? "text-zinc-300" : "text-zinc-600",
                      )}>
                        {cat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="py-8 sm:py-10">
              <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
                <Card className="border-white/10 bg-white/[0.03]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-300/10 text-sm font-bold text-emerald-300">
                        {currentCategory + 1}
                      </span>
                      {CATEGORIES[currentCategory].label}
                    </CardTitle>
                    <p className="mt-1 text-sm text-zinc-500">
                      {currentCategory + 1} of {CATEGORIES.length} categories · {CATEGORIES[currentCategory].questions.length} questions
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {CATEGORIES[currentCategory].questions.map((question, qi) => (
                      <div key={question.id} className="space-y-3">
                        <p className="text-sm font-medium leading-6 text-zinc-200">
                          {currentCategory * 5 + qi + 1}. {question.text}
                        </p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                          {SCALE_LABELS.map((label, value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setAnswer(question.id, value)}
                              className={cn(
                                "rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                                answers[question.id] === value
                                  ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-200"
                                  : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200",
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between gap-3 pt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={currentCategory === 0}
                        onClick={() => setCurrentCategory((c) => c - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      {currentCategory < CATEGORIES.length - 1 ? (
                        <Button
                          type="button"
                          disabled={!categoryAnswered}
                          onClick={() => {
                            setCurrentCategory((c) => c + 1);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Next Category
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          disabled={!allAnswered}
                          onClick={handleComplete}
                        >
                          See My Results
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        ) : results ? (
          <ResultsDashboard
            results={results}
            name={name}
            email={email}
            status={status}
            error={error}
            onNameChange={setName}
            onEmailChange={setEmail}
            onSubmitReport={submitReport}
          />
        ) : null}
      </main>
    </div>
  );
}

function ResultsDashboard({
  results,
  name,
  email,
  status,
  error,
  onNameChange,
  onEmailChange,
  onSubmitReport,
}: {
  results: MaturityResults;
  name: string;
  email: string;
  status: "idle" | "sending" | "sent" | "error";
  error: string;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onSubmitReport: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const positioning = getDuelyPositioning(results.weakest.key);
  const levelColor = getLevelColor(results.level);

  return (
    <>
      {/* Hero Score */}
      <section className="border-b border-white/10 py-12 sm:py-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Your Assessment Results
          </p>
          <div className={cn("mt-8 flex h-40 w-40 items-center justify-center rounded-full border-4", levelColor.border, levelColor.bg)}>
            <div>
              <p className={cn("text-5xl font-bold tracking-tight", levelColor.text)}>
                {results.overallScore}
              </p>
              <p className="text-sm font-medium text-zinc-400">/100</p>
            </div>
          </div>
          <h1 className={cn("mt-6 text-3xl font-semibold tracking-tight sm:text-4xl", levelColor.text)}>
            {results.level}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-zinc-400">
            {results.levelDescription}
          </p>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Category Scores */}
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-sky-300" />
                Category Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {results.categories.map((cat) => (
                <div key={cat.key}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-zinc-200">{cat.label}</span>
                    <span className="font-semibold text-zinc-100">{cat.percentage}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10">
                    <div
                      className={cn(
                        "h-3 rounded-full transition-all",
                        cat.percentage >= 80 ? "bg-emerald-400" :
                        cat.percentage >= 50 ? "bg-amber-300" : "bg-red-400",
                      )}
                      style={{ width: `${Math.max(cat.percentage, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weakest & Strongest */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="border-red-400/20 bg-red-400/[0.04]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-300">
                  <ShieldAlert className="h-5 w-5" />
                  Weakest Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-zinc-50">
                  {results.weakest.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-red-300">{results.weakest.percentage}%</p>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {getWeakestExplanation(results.weakest.key)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-400/20 bg-emerald-400/[0.04]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-300">
                  <TrendingUp className="h-5 w-5" />
                  Strongest Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-zinc-50">
                  {results.strongest.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-300">{results.strongest.percentage}%</p>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {getStrongestExplanation(results.strongest.key)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Improvement Opportunity */}
          <Card className="mt-6 border-amber-300/20 bg-amber-300/[0.04]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-300" />
                Improvement Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm leading-6 text-zinc-300">
                Organizations with lower collections maturity often experience:
              </p>
              <ul className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
                {[
                  "More overdue invoices",
                  "Longer payment cycles",
                  "Less predictable cash flow",
                  "Higher administrative effort",
                  "Greater reliance on manual follow-up",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Personalized Recommendations */}
          <Card className="mt-6 border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-sky-300" />
                Personalized Recommendations
              </CardTitle>
              <p className="mt-1 text-sm text-zinc-500">
                Based on your weakest category: {results.weakest.label}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {results.recommendations.map((rec) => (
                  <li key={rec} className="flex gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Email capture */}
      <section className="border-y border-white/10 bg-white/[0.025] py-12">
        <div className="mx-auto grid w-full max-w-4xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">
              Get Your Collections Maturity Report
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-50">
              Get Your Personalized Maturity Report
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
              Receive a PDF version of your assessment plus a personalized improvement roadmap.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
              {[
                "Overall score & maturity level",
                "Category breakdown",
                "Weakest area analysis",
                "Personalized recommendations",
                "30-day improvement roadmap",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {status === "sent" ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] p-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-300" />
              <p className="mt-4 text-lg font-semibold text-zinc-50">
                Your personalized collections maturity report has been emailed.
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-300">
                Check your inbox for the PDF report and improvement roadmap.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmitReport} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Name</Label>
                  <Input id="report-name" autoComplete="name" required value={name} onChange={(e) => onNameChange(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-email">Email</Label>
                  <Input id="report-email" autoComplete="email" required type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={status === "sending"}>
                  {status === "sending" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {status === "sending" ? "Generating report..." : "Email My Report"}
                </Button>
                {status === "error" && (
                  <Button type="submit" variant="secondary" size="lg">Retry</Button>
                )}
              </div>
              {status === "error" && (
                <p className="text-sm leading-6 text-red-300">{error}</p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* Dynamic Duely CTA */}
      <section className="py-14">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Solve This With Duely
          </p>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-zinc-50">
                {positioning.headline}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
                {positioning.body}
              </p>
            </div>
            <Link href="/signup" onClick={() => trackEvent("trial_clicked", { tool: "collections_maturity", weakest: results.weakest.label })}>
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Related Tool */}
      <section className="border-t border-white/10 bg-white/[0.015] py-12">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">
            Related Tool
          </p>
          <p className="max-w-xl text-base leading-7 text-zinc-400">
            Want to estimate the financial impact of delayed payments?
          </p>
          <Link href="/tools/payment-leak-calculator" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Use the Payment Leak Estimator
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}

function getLevelColor(level: string) {
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
