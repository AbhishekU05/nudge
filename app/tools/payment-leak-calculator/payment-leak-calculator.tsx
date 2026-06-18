"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Gauge,
  Mail,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Zap,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BENCHMARKS,
  calculatePaymentLeak,
  formatCurrency,
  formatNumber,
  type PaymentLeakInputs,
} from "@/lib/payment-leak-calculator/calculations";
import { MinimalSiteHeader } from "@/components/site/minimal-site-header";
import { cn } from "@/lib/utils";

const initialInputs: PaymentLeakInputs = {
  activeClients: 15,
  averageInvoiceValue: 3000,
  latePaymentPercentage: 20,
  monthlyOperatingExpenses: 30000,
  paymentDelayDays: 21,
};

function trackEvent(eventName: string, params?: Record<string, string | number>) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", eventName, params);
  }
}

export function PaymentLeakCalculator() {
  const [inputs, setInputs] = useState<PaymentLeakInputs>(initialInputs);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [leadSource, setLeadSource] = useState<{
    source?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>({});
  const hasTrackedStart = useRef(false);
  const hasTrackedComplete = useRef(false);
  const results = useMemo(() => calculatePaymentLeak(inputs), [inputs]);
  const meaning = getMeaning(inputs, results);
  const biggestLeak = getBiggestLeak(results);
  const benchmarkInterpretation = getBenchmarkInterpretation(
    results.riskScore,
    results.annualImpact,
    results.cashTiedUp,
  );
  const riskExplanation = getRiskExplanation(results.riskLevel);
  const dynamicCta = getDynamicCta(results.riskLevel, results.annualImpact);
  const shareUrl = useMemo(() => buildShareUrl(inputs), [inputs]);
  const recoveryOpportunity = useMemo(() => {
    const improvedDelay = Math.round(inputs.paymentDelayDays / 2);
    const improvedResults = calculatePaymentLeak({ ...inputs, paymentDelayDays: improvedDelay });
    return {
      currentDelay: inputs.paymentDelayDays,
      improvedDelay,
      potentialRecovery: results.annualImpact - improvedResults.annualImpact,
    };
  }, [inputs, results.annualImpact]);
  const shareText = `I just calculated that delayed payments could cost my agency ${formatCurrency(
    results.annualImpact,
  )} over the next 12 months.\n\nCalculated using Duely's Payment Leak Estimator.`;
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText,
  )}&url=${encodeURIComponent(shareUrl)}`;
  const benchmarkRows = [
    { label: "Healthy agency", score: BENCHMARKS.healthyAgency },
    { label: "Industry average", score: BENCHMARKS.averageAgency },
    { label: "High-risk agency", score: BENCHMARKS.highRiskAgency },
    { label: "Your agency", score: results.riskScore, strong: true },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextInputs: PaymentLeakInputs = { ...initialInputs };
    const mappings: Array<[keyof PaymentLeakInputs, string]> = [
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

    setLeadSource({
      source: params.get("source") || undefined,
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
    });

    window.setTimeout(() => setInputs(nextInputs), 0);
  }, []);

  useEffect(() => {
    if (!hasTrackedStart.current || hasTrackedComplete.current) return;
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

  function updateInput(key: keyof PaymentLeakInputs, value: string) {
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

  async function submitReport(event: FormEvent<HTMLFormElement>) {
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

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setStatus("error");
        setError(payload.error ?? "Could not send the report. Please try again.");
        return;
      }

      setStatus("sent");
      trackEvent("report_sent", { risk_level: results.riskLevel });
    } catch {
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <MinimalSiteHeader />

      <main id="main-content">
        <section className="border-b border-white/10 py-10 sm:py-14 lg:py-16">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Agency Payment Leak Estimator
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
                Find the cash flow stuck inside delayed client payments.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                Estimate how much working capital is tied up in late invoices,
                see your collections risk score, and get a personalized Duely
                report.
              </p>
            </div>

            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle>Estimator Inputs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    label="Number of active clients"
                    min={1}
                    value={inputs.activeClients}
                    onChange={(value) => updateInput("activeClients", value)}
                  />
                  <NumberField
                    label="Average monthly invoice value"
                    min={0}
                    prefix="USD"
                    value={inputs.averageInvoiceValue}
                    onChange={(value) =>
                      updateInput("averageInvoiceValue", value)
                    }
                  />
                  <NumberField
                    label="Percentage of invoices paid late"
                    max={100}
                    min={0}
                    suffix="%"
                    value={inputs.latePaymentPercentage}
                    onChange={(value) =>
                      updateInput("latePaymentPercentage", value)
                    }
                  />
                  <NumberField
                    label="Average payment delay"
                    max={180}
                    min={0}
                    suffix="days"
                    value={inputs.paymentDelayDays}
                    onChange={(value) => updateInput("paymentDelayDays", value)}
                  />
                  <div className="sm:col-span-2">
                    <NumberField
                      label="Monthly operating expenses"
                      min={0}
                      optional
                      prefix="USD"
                      value={inputs.monthlyOperatingExpenses ?? ""}
                      onChange={(value) =>
                        updateInput("monthlyOperatingExpenses", value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-emerald-300/20 bg-emerald-300/[0.06] md:col-span-2 xl:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="text-emerald-300"><TrendingUp className="h-5 w-5" /></span>
                    Annualized Cash Flow Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
                    {formatCurrency(results.annualImpact)}
                  </p>
                  <p className="mt-2 text-sm text-emerald-200">If current delays persist for 12 months</p>
                </CardContent>
              </Card>
              <MetricCard
                icon={<DollarSign className="h-5 w-5" />}
                label="Cash Currently Outstanding"
                value={formatCurrency(results.cashTiedUp)}
                note="Sitting outside your business today"
              />
              <MetricCard
                icon={<Gauge className="h-5 w-5" />}
                label="Collections Risk Score"
                value={`${results.riskScore}/100`}
                note={`${results.riskLevel} risk`}
              />
              <Card className="border-white/10 bg-white/[0.03]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-zinc-300">
                    <ShieldAlert className="h-5 w-5 text-amber-300" />
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.recommendations.map((recommendation) => (
                      <li
                        key={recommendation}
                        className="flex gap-2 text-sm text-zinc-300"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 border-sky-300/20 bg-sky-300/[0.06]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-sky-300" />
                  Recovery Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm text-zinc-400">
                      <Clock className="h-4 w-4" />
                      Current delay
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-50">
                      {recoveryOpportunity.currentDelay} days
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-sm text-zinc-400">
                      <Clock className="h-4 w-4" />
                      Improved delay
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-300">
                      {recoveryOpportunity.improvedDelay} days
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-sm text-zinc-400">
                      <TrendingUp className="h-4 w-4" />
                      Potential recovery
                    </p>
                    <p className="mt-1 text-2xl font-bold text-sky-300">
                      {formatCurrency(recoveryOpportunity.potentialRecovery)}/year
                    </p>
                  </div>
                </div>
                <p className="mt-5 rounded-lg border border-sky-300/10 bg-sky-300/[0.04] p-3 text-sm leading-6 text-zinc-300">
                  If your agency cut payment delays in half, this much working capital could return to the business.
                </p>
              </CardContent>
            </Card>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <Card className="border-emerald-300/20 bg-emerald-300/[0.06]">
                <CardHeader>
                  <CardTitle>What This Means</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xl font-semibold leading-7 text-zinc-50">
                    You currently have {formatCurrency(results.cashTiedUp)} sitting outside your business.
                  </p>
                  <p className="text-sm leading-6 text-zinc-300">
                    {meaning.operatingExpenses}
                  </p>
                  <p className="text-sm leading-6 text-zinc-300">
                    This equals about {meaning.averageRetainers} average client retainers and {meaning.payrollWeeks} weeks of payroll.
                  </p>
                  <p className="text-sm font-medium leading-6 text-emerald-200">
                    This amount compounds to {formatCurrency(results.annualImpact)} annually.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.03]">
                <CardHeader>
                  <CardTitle>Biggest Contributor To Your Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold leading-7 text-zinc-50">
                    {biggestLeak.label} contributes {biggestLeak.percent}% of your risk score.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {biggestLeak.explanation}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <Card className="border-white/10 bg-white/[0.03]">
                <CardHeader>
                  <CardTitle>Risk Gauge</CardTitle>
                </CardHeader>
                <CardContent>
                  <RiskGauge
                    explanation={riskExplanation}
                    level={results.riskLevel}
                    score={results.riskScore}
                  />
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.03]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-sky-300" />
                    Annual Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-5 text-sm font-medium leading-6 text-zinc-200">
                    If nothing changes, delayed payments could impact approximately {formatCurrency(results.annualImpact)} over the next 12 months.
                  </p>
                  <ImpactChart
                    annualImpact={results.annualImpact}
                    cashTiedUp={results.cashTiedUp}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <BreakdownCard
                label="Late payment percentage"
                score={results.latePaymentScore}
                total={50}
              />
              <BreakdownCard
                label="Delay days"
                score={results.delayDaysScore}
                total={30}
              />
              <BreakdownCard
                label="Client concentration"
                score={results.clientConcentrationScore}
                total={20}
              />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <Card className="border-white/10 bg-white/[0.03]">
                <CardHeader>
                  <CardTitle>Benchmark Comparison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-zinc-200">
                    {benchmarkInterpretation}
                  </p>
                  {benchmarkRows.map((row) => (
                    <div key={row.label}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span
                          className={cn(
                            "text-zinc-400",
                            row.strong && "font-semibold text-zinc-50",
                          )}
                        >
                          {row.label}
                        </span>
                        <span className="font-medium text-zinc-200">
                          {row.score}/100
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            row.strong ? "bg-emerald-300" : "bg-zinc-500",
                          )}
                          style={{ width: `${row.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.03]">
                <CardHeader>
                  <CardTitle>Operating Expense Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-zinc-50">
                    {results.operatingExpenseCoverage
                      ? `${(results.operatingExpenseCoverage * 100).toFixed(0)}%`
                      : "Add expenses"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {results.operatingExpenseCoverage
                      ? "of one month of operating expenses is currently tied up in delayed payments."
                      : "Enter monthly operating expenses to see how much runway is caught in late invoices."}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle>Share Your Result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-zinc-200">
                  I just calculated that delayed payments could cost my agency {formatCurrency(results.annualImpact)} over the next 12 months.
                  <br />
                  <br />
                  Calculated using Duely&apos;s Payment Leak Estimator.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href={xShareUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent("share_clicked", { platform: "x" })}>
                    <Button variant="secondary" className="w-full sm:w-auto">
                      Share on X
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={copyShareLink}
                  >
                    <Copy className="h-4 w-4" />
                    {copyStatus === "copied" ? "Copied" : "Copy link"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025] py-12">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">
                Get Your Full Collections Report
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-50">
                Get Your Personalized Collections Report
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
                The report contains additional insights beyond what is shown on
                this page.
              </p>
              <ul className="mt-5 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                {[
                  "Full risk breakdown",
                  "Benchmark comparison",
                  "Biggest leak analysis",
                  "Recommended action plan",
                  "PDF copy for future reference",
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
                  Your personalized collections report has been emailed.
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-300">
                  Check your inbox for the PDF report and save it for your next collections review.
                </p>
              </div>
            ) : (
            <form onSubmit={submitReport} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Name</Label>
                  <Input
                    id="report-name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-email">Email</Label>
                  <Input
                    id="report-email"
                    autoComplete="email"
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {status === "sending" ? "Generating report..." : "Email My Report"}
                </Button>
                {status === "error" && (
                  <Button type="submit" variant="secondary" size="lg">
                    Retry
                  </Button>
                )}
              </div>
              {status === "error" && (
                <p className="text-sm leading-6 text-red-300">{error}</p>
              )}
            </form>
            )}
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              {dynamicCta.eyebrow}
            </p>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-zinc-50">
                  {dynamicCta.headline}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
                  {dynamicCta.body}
                </p>
              </div>
              <Link href="/signup" onClick={() => trackEvent("trial_clicked", { risk_level: results.riskLevel })}>
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-white/[0.015] py-12">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">
              Related Tool
            </p>
            <p className="max-w-xl text-base leading-7 text-zinc-400">
              Want to evaluate the systems behind your collections process?
            </p>
            <Link href="/tools/collections-maturity-assessment" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Take the Collections Maturity Assessment
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function NumberField({
  label,
  max,
  min,
  onChange,
  optional,
  prefix,
  suffix,
  value,
}: {
  label: string;
  max?: number;
  min?: number;
  onChange: (value: string) => void;
  optional?: boolean;
  prefix?: string;
  suffix?: string;
  value: number | string;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {optional && <span className="text-zinc-500"> (optional)</span>}
      </Label>
      <div className="flex rounded-lg border border-border bg-white/[0.04] focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring">
        {prefix && (
          <span className="flex items-center px-3 text-xs font-semibold uppercase text-zinc-500">
            {prefix}
          </span>
        )}
        <input
          className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          max={max}
          min={min}
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix && (
          <span className="flex items-center px-3 text-xs font-semibold uppercase text-zinc-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  note,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  note?: string;
  value: string;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-zinc-300">
          <span className="text-emerald-300">{icon}</span>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight text-zinc-50">
          {value}
        </p>
        {note && <p className="mt-2 text-sm text-amber-300">{note}</p>}
      </CardContent>
    </Card>
  );
}

function RiskGauge({
  explanation,
  level,
  score,
}: {
  explanation: string;
  level: string;
  score: number;
}) {
  const rotation = -90 + (score / 100) * 180;

  return (
    <div className="mx-auto max-w-sm">
      <div className="relative aspect-[2/1] overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-full rounded-t-full border-[18px] border-b-0 border-white/10" />
        <div className="absolute inset-x-0 bottom-0 h-full rounded-t-full border-[18px] border-b-0 border-emerald-300 [clip-path:inset(0_50%_0_0)]" />
        <div className="absolute inset-x-0 bottom-0 h-full rounded-t-full border-[18px] border-b-0 border-amber-300 [clip-path:inset(0_25%_0_50%)]" />
        <div className="absolute inset-x-0 bottom-0 h-full rounded-t-full border-[18px] border-b-0 border-red-300 [clip-path:inset(0_0_0_75%)]" />
        <div
          className="absolute bottom-0 left-1/2 h-1 w-[42%] origin-left rounded-full bg-zinc-50 transition-transform"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
        <div className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-zinc-50" />
      </div>
      <div className="mt-4 text-center">
        <p className="text-4xl font-semibold text-zinc-50">{score}/100</p>
        <p className="mt-2 text-sm font-medium text-amber-300">{level} risk</p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {explanation}
        </p>
      </div>
    </div>
  );
}

function ImpactChart({
  annualImpact,
  cashTiedUp,
}: {
  annualImpact: number;
  cashTiedUp: number;
}) {
  const bars = [
    { label: "1 month", value: cashTiedUp },
    { label: "3 months", value: cashTiedUp * 3 },
    { label: "12 months", value: annualImpact },
  ];
  const max = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <div className="space-y-4">
      {bars.map((bar) => (
        <div key={bar.label}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-zinc-400">{bar.label}</span>
            <span className="font-medium text-zinc-200">
              {formatCurrency(bar.value)}
            </span>
          </div>
          <div className="h-9 rounded-lg bg-white/10">
            <div
              className="flex h-9 min-w-10 items-center justify-end rounded-lg bg-sky-400 pr-2 text-xs font-semibold text-zinc-950"
              style={{ width: `${Math.max((bar.value / max) * 100, 8)}%` }}
            >
              {formatNumber(bar.value)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BreakdownCard({
  label,
  score,
  total,
}: {
  label: string;
  score: number;
  total: number;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-300">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-zinc-50">
          {score.toFixed(1)}/{total}
        </p>
        <div className="mt-4 h-2 rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-amber-300"
            style={{ width: `${(score / total) * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function getMeaning(inputs: PaymentLeakInputs, results: ReturnType<typeof calculatePaymentLeak>) {
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

function getBiggestLeak(results: ReturnType<typeof calculatePaymentLeak>) {
  const contributors = [
    {
      explanation:
        "Too many invoices are entering collections instead of arriving on time. Reducing late payment frequency lowers risk before reminders are even needed.",
      label: "Late payment percentage",
      value: results.latePaymentScore,
    },
    {
      explanation:
        "Payment delays are stretching cash conversion after invoices are already late. This is your largest collections bottleneck.",
      label: "Average payment delay",
      value: results.delayDaysScore,
    },
    {
      explanation:
        "A smaller client base makes each delayed payment matter more. One slow payer can create an outsized cash-flow gap.",
      label: "Client concentration",
      value: results.clientConcentrationScore,
    },
  ];
  const biggest = contributors.reduce((current, next) =>
    next.value > current.value ? next : current,
  );
  const total = Math.max(results.riskScore, 1);

  return {
    ...biggest,
    percent: Math.round((biggest.value / total) * 100),
  };
}

function getBenchmarkInterpretation(score: number, annualImpact: number, cashTiedUp: number) {
  if (score < BENCHMARKS.averageAgency) {
    return `Your collections process is healthier than the average agency. However, delayed payments could still keep ${formatCurrency(annualImpact)} outside your business over the next year.`;
  }

  if (score >= BENCHMARKS.highRiskAgency) {
    return `Delayed payments are creating meaningful cash-flow risk. Agencies at this level often struggle with forecasting and follow-up consistency. You currently have ${formatCurrency(cashTiedUp)} sitting outside your business.`;
  }

  return `Your collections process is around the industry average. Small improvements in follow-up consistency could unlock significant cash flow — currently ${formatCurrency(cashTiedUp)} is outstanding.`;
}

function getRiskExplanation(level: string) {
  if (level === "High") {
    return "High-risk agencies often have visible cash-flow drag, repeated overdue invoices, and payment promises that need active escalation. The next step is to automate follow-ups and track every commitment.";
  }

  if (level === "Medium") {
    return "Medium-risk agencies usually collect eventually, but follow-up inconsistency creates avoidable delays. The next step is to track payment promises and standardize reminders.";
  }

  return "Low-risk agencies typically have predictable cash flow and fewer overdue invoices. The next step is to keep monitoring this as client count and invoice volume grow.";
}

function getDynamicCta(level: string, annualImpact: number) {
  if (level === "High") {
    return {
      body: "Duely helps recover cash faster through automated collections workflows.",
      eyebrow: "Stop Losing Working Capital",
      headline: `Your agency could be losing ${formatCurrency(annualImpact)} in working capital to delayed payments.`,
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

function buildShareUrl(inputs: PaymentLeakInputs) {
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
