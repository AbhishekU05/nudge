/* eslint-disable */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";

import { Container } from "@/components/site/container";
import { FadeIn, Reveal, SlideUp, SlideIn } from "@/components/site/scroll-animation";
import { HeroDashboard } from "@/components/site/hero-dashboard";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { LifetimeDealSection } from "@/components/site/lifetime-deal-section";
import { getRemainingLifetimeSpots } from "@/app/actions/leads";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEmailLinkErrorMessage } from "@/lib/auth-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Zap,
  CreditCard,
  User,
  AlertCircle
} from "lucide-react";

export const metadata: Metadata = {
  title: "Invoice Follow-Up Software for Freelancers | Duely",
  description: "Stop chasing freelance clients out of your inbox. Track promises, partial payments, and automate follow-ups.",
  alternates: {
    canonical: "/for-freelancers",
  },
};

export default async function ForFreelancersPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    error_code?: string;
    error_description?: string;
}>;
}) {
  const spotsLeft = await getRemainingLifetimeSpots();

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-32 lg:pb-40">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(79,70,229,0.15),transparent_60%),radial-gradient(ellipse_at_80%_40%,rgba(168,85,247,0.08),transparent_50%)]" />

          <Container>
            <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <FadeIn className="max-w-2xl">
                <h1 className="mt-8 text-pretty text-5xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-6xl lg:text-[4.5rem] lg:leading-[1.05]">
                  Freelancers lose $40B+ a year to late payments. You don't have to.
                </h1>
                <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400">
                  Stop chasing freelance clients out of your inbox. Track promises, partial payments, and automate follow-ups.
                </p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-indigo-500/20 w-full sm:w-auto">
                      Start free trial — no card required
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </FadeIn>

              <Reveal delay={0.2} className="relative z-10 lg:ml-auto w-full max-w-[640px] lg:max-w-none">
                <HeroDashboard />
              </Reveal>
            </div>
          </Container>
        </section>

        {/* STATS SECTION */}
        <section className="py-16 sm:py-20">
          <Container>
            <FadeIn>
              <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8 lg:gap-16 mx-auto max-w-4xl text-center">
                {[
                  {
                    stat: "$40B+",
                    label: "The global cost",
                    description: "Lost globally every year to late payments",
                    source: "World Bank",
                  },
                  {
                    stat: "50%",
                    label: "The default rate",
                    description: "of US B2B invoices are currently overdue",
                    source: "Atradius 2024",
                  },
                  {
                    stat: "52%",
                    label: "The silent write-off",
                    description: "of small businesses give up chasing payments to avoid the awkwardness",
                    source: "GoCardless / FSB 2025",
                  },
                ].map((item) => (
                  <div key={item.stat}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                      {item.label}
                    </p>
                    <p className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
                      {item.stat}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                      {item.description}
                    </p>
                    <p className="mt-2 text-xs text-zinc-600">
                      {item.source}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </Container>
        </section>

        {/* WORKFLOW SECTIONS */}
        <section className="relative overflow-hidden py-24 sm:py-32 space-y-32 sm:space-y-40 bg-zinc-950/50 border-y border-white/5 backdrop-blur-sm">

          {/* Section 1: Promise Tracking */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <SlideIn left>
                <div className="relative order-2 lg:order-1">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 pb-1">Record payment promise</p>
                      <div className="space-y-2">
                        <label className="block text-xs text-zinc-400">Promised by</label>
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300">
                          <span>Friday, May 30</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs text-zinc-400">Notes</label>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-500 italic">Will pay after invoice approval from accounts team</div>
                      </div>
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm">
                        <p className="font-medium text-amber-200">Promised by May 30</p>
                        <p className="mt-1 text-amber-200/70">Will pay after invoice approval from accounts team</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-border bg-white/[0.025] px-3 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-zinc-300">DA</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-100">David Anand</p>
                          <p className="text-xs text-zinc-600">david@acmecorp.com</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-zinc-100">$4,200</p>
                          <p className="text-xs text-amber-400">Promised May 30</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
              <FadeIn delay={0.2} className="order-1 lg:order-2 max-w-xl lg:pl-12 xl:pl-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 mb-6">
                  <ShieldCheck className="h-6 w-6 text-amber-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  David said he&apos;d pay by Friday. It&apos;s Monday. Nobody remembers exactly what was said.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Duely logs every promise with a date and notes — so you always know exactly what was agreed, when it was due, and whether it happened.
                </p>
              </FadeIn>
            </div>
          </Container>

          {/* Section 2: Follow-up drafting by tone */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12 xl:pr-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 mb-6">
                  <MessageSquare className="h-6 w-6 text-purple-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Too friendly and they ignore it. Too firm and you damage the relationship.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Pick a tone. Duely drafts the message. Edit it before you send.
                </p>
              </FadeIn>
              <SlideIn right delay={0.2} className="flex justify-center">
                <div className="relative w-full max-w-[26rem]">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20 space-y-3">
                    <CardContent className="p-0 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Tone</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[{label:"Friendly",desc:"Warm & casual"},{label:"Professional",desc:"Neutral & clear",active:true},{label:"Firm",desc:"Direct & assertive"}].map((t) => (
                          <div key={t.label} className={`rounded-xl border px-3 py-2.5 text-left ${t.active ? "border-indigo-500/40 bg-indigo-500/10" : "border-white/10 bg-white/[0.03]"}`}>
                            <p className={`text-xs font-semibold ${t.active ? "text-indigo-200" : "text-zinc-400"}`}>{t.label}</p>
                            <p className="mt-0.5 text-[10px] leading-none text-zinc-600">{t.desc}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Draft message</p>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 font-mono text-xs leading-5 text-zinc-400 space-y-1">
                        <p>Hi Sarah,</p>
                        <p className="mt-1">I wanted to follow up on invoice #1042 for $2,400, which was due on May 15th.</p>
                        <p className="mt-1">Please let me know if you have any questions. Happy to help.</p>
                        <p className="mt-1">Best,<br/>Alex</p>
                      </div>
                      <p className="text-xs text-zinc-600">Not happy with the wording? Edit it before sending.</p>
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
            </div>
          </Container>

          {/* Section 3: Partial payments */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <SlideIn left>
                <div className="relative order-2 lg:order-1">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.08),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0 space-y-3">
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white/[0.025] px-3 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-zinc-300">MR</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-100">Marcus Reid</p>
                          <p className="text-xs text-zinc-600">Partial</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-zinc-100">$1,800</p>
                          <p className="text-xs text-zinc-600">$600 paid</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span>Paid: <span className="font-semibold text-zinc-100">$600</span></span>
                          <span>Remaining: <span className="font-semibold text-zinc-100">$1,200</span></span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
                          <div className="h-full w-1/3 rounded-full bg-emerald-500" />
                        </div>
                        <p className="text-right text-xs text-zinc-600">33% collected of $1,800.00</p>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Log payment</p>
                      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-500">Amount received (max $1,200.00)</div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 flex items-center justify-between text-sm">
                        <p className="font-medium text-zinc-200">$600.00 <span className="ml-2 rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-xs text-zinc-400">Logged by you</span></p>
                        <p className="text-xs text-zinc-600">May 10, 2025</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
              <FadeIn delay={0.2} className="order-1 lg:order-2 max-w-xl lg:pl-12 xl:pl-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 mb-6">
                  <CreditCard className="h-6 w-6 text-indigo-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  He paid half and went quiet. You don&apos;t even know how much is still outstanding.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Log partial payments as they come in. Duely tracks exactly what&apos;s been paid, what&apos;s still owed, and shows a progress bar so nothing gets lost.
                </p>
              </FadeIn>
            </div>
          </Container>

          {/* Section 4: Automated reminders */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12 xl:pr-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 mb-6">
                  <Zap className="h-6 w-6 text-emerald-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  You&apos;ve followed up three times. You shouldn&apos;t have to do it a fourth.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Set up automated reminders as a last resort. Duely sends them on schedule until the client pays or you stop the sequence.
                </p>
              </FadeIn>
              <SlideIn right delay={0.2} className="flex justify-center">
                <div className="relative w-full max-w-[22rem]">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Current status</p>
                      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-200">Sending reminders</p>
                          <p className="mt-0.5 text-xs text-zinc-600">Every 7 days</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-300">Pause</div>
                      </div>
                      <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/20 p-3 text-xs text-zinc-400">
                        <div className="flex justify-between"><span className="text-zinc-500">Next send:</span><span className="text-zinc-300">May 28, 2025, 9:00 AM</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">Last sent:</span><span className="text-zinc-300">May 21, 2025</span></div>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                        <Zap className="h-3 w-3" />Reminder will stop automatically when marked paid
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
            </div>
          </Container>

          {/* Section 5: Reminders from your own email */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12 xl:pr-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 mb-6">
                  <MessageSquare className="h-6 w-6 text-sky-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  A reminder from a billing tool looks like a collections agency. A reminder from you gets read.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Duely connects to your Gmail and sends reminders from your own address. Your clients see your name in the from field, not a SaaS tool.
                </p>
              </FadeIn>
              <SlideIn right delay={0.2} className="flex justify-center">
                <div className="relative w-full max-w-[26rem]">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.07),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Gmail connection</p>
                      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-emerald-200">Connected</p>
                          <p className="text-xs text-emerald-300/60 truncate">alex@youragency.com</p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 space-y-1">
                        <p className="text-xs text-zinc-500">From</p>
                        <p className="text-sm text-zinc-200">Alex Chen &lt;alex@youragency.com&gt;</p>
                        <p className="mt-2 text-xs text-zinc-500">To</p>
                        <p className="text-sm text-zinc-200">sarah@clientco.com</p>
                        <p className="mt-2 text-xs text-zinc-500">Subject</p>
                        <p className="text-sm text-zinc-200">Following up on invoice #1042</p>
                      </div>
                      <p className="text-xs text-zinc-600">Duely never stores your email content. OAuth only.</p>
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
            </div>
          </Container>

          {/* Section 6: Follow-up logging and timeline */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <SlideIn left>
                <div className="relative order-2 lg:order-1">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.07),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Log a follow-up</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {["Email","Call","WhatsApp","Other"].map((m, i) => (
                          <div key={m} className={`rounded-xl border px-2.5 py-2 text-center text-xs ${i===0 ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-200" : "border-white/10 bg-white/[0.03] text-zinc-400"}`}>{m}</div>
                        ))}
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-500 italic">Left a voicemail, will call back tomorrow</div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-400">Outcome: <span className="text-amber-300 font-medium">Promise made</span></div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 pt-1">Follow-up history</p>
                      {[{method:"Email",outcome:"No response",outcomeColor:"text-zinc-400",date:"May 14",note:"Sent invoice reminder"},{method:"Call",outcome:"Promise made",outcomeColor:"text-amber-300",date:"May 18",note:"Said will pay by May 30"}].map((e) => (
                        <div key={e.date} className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-xs text-zinc-400">{e.method}</span>
                            <span className={`text-xs font-medium ${e.outcomeColor}`}>{e.outcome}</span>
                          </div>
                          <p className="mt-1 text-sm text-zinc-300">{e.note}</p>
                          <p className="mt-1 text-xs text-zinc-600">{e.date}, 2025</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
              <FadeIn delay={0.2} className="order-1 lg:order-2 max-w-xl lg:pl-12 xl:pl-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 mb-6">
                  <ShieldCheck className="h-6 w-6 text-purple-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  You followed up last Tuesday. Or was it Wednesday? And what did they say again?
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Every call, email, and WhatsApp message gets logged with the date, method, note, and outcome. A timeline per client, so you always know exactly where things stand.
                </p>
              </FadeIn>
            </div>
          </Container>

          {/* Section 7: Full client history */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12 xl:pr-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 mb-6">
                  <CreditCard className="h-6 w-6 text-indigo-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  What did you say last time? When did they promise? Did they ever actually pay that partial?
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Every event in one timeline per client — payments, promises, follow-ups, notes — in chronological order. Never lose context before a call again.
                </p>
              </FadeIn>
              <SlideIn right delay={0.2} className="flex justify-center">
                <div className="relative w-full max-w-[26rem]">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.07),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 pb-1">Sarah Okafor · $2,400</p>
                      {[
                        {dot:"bg-emerald-400",label:"$600 partial payment logged",sub:"May 10 · Logged by you"},
                        {dot:"bg-primary",label:"Payment promised by May 30",sub:"May 14 · Via call"},
                        {dot:"bg-zinc-600",label:"Follow-up email sent",sub:"May 18 · No response"},
                        {dot:"bg-amber-400",label:"WhatsApp — promise made",sub:"May 21 · Said Friday"},
                        {dot:"bg-zinc-600",label:"Automated reminder sent",sub:"May 28 · 9:00 AM"},
                      ].map((item) => (
                        <div key={item.label} className="flex gap-3">
                          <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} />
                          <div>
                            <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                            <p className="text-xs text-zinc-500">{item.sub}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
            </div>
          </Container>

          {/* Section 8: QuickBooks and Xero */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <SlideIn left>
                <div className="relative order-2 lg:order-1">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.07),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0 space-y-3">
                      {[
                        {name:"QuickBooks",connected:true,synced:"Last synced May 25, 9:04 AM",imported:"12 invoices imported"},
                        {name:"Xero",connected:false,synced:null,imported:null},
                      ].map((int) => (
                        <div key={int.name} className={`rounded-xl border px-4 py-4 space-y-2 ${int.connected ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/10 bg-white/[0.02]"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className={`h-4 w-4 ${int.connected ? "text-emerald-400" : "text-zinc-600"}`} />
                              <p className="text-sm font-semibold text-zinc-100">{int.name}</p>
                              {int.connected && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">Connected</span>}
                            </div>
                            <div className={`rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium ${int.connected ? "text-red-400" : "text-indigo-300 bg-indigo-500/10 border-indigo-500/20"}`}>
                              {int.connected ? "Disconnect" : "Connect"}
                            </div>
                          </div>
                          {int.connected && <p className="text-xs text-zinc-500">{int.synced} · {int.imported}</p>}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
              <FadeIn delay={0.2} className="order-1 lg:order-2 max-w-xl lg:pl-12 xl:pl-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 mb-6">
                  <Zap className="h-6 w-6 text-emerald-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Your invoices are already in QuickBooks. You shouldn&apos;t have to enter them again.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Connect your QuickBooks or Xero account and Duely imports your outstanding invoices automatically. When a client pays, Duely stops chasing them.
                </p>
              </FadeIn>
            </div>
          </Container>

          {/* Section 9: Stripe */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12 xl:pr-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 mb-6">
                  <CreditCard className="h-6 w-6 text-violet-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Stripe sends the invoice. Duely handles everything after.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Stripe sends the invoice. The moment it&apos;s created, Duely starts watching. Late? It follows up. Paid? It stops.
                </p>
              </FadeIn>
              <SlideIn right delay={0.2} className="flex justify-center">
                <div className="relative w-full max-w-[26rem]">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.07),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Stripe Integration <span className="ml-2 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300 normal-case tracking-normal">Beta</span></p>
                      
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
                          <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-violet-200">Listening to Stripe</p>
                            <p className="text-xs text-violet-300/60 truncate">Watching for new invoices &amp; payments</p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span className="text-zinc-200 text-sm">Invoice generated</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span className="text-zinc-200 text-sm">Follow-up sent (2 days late)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
                            <span className="text-emerald-300 font-medium text-sm">Waiting for payment</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
            </div>
          </Container>

          {/* Section 10: CSV export */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <SlideIn left>
                <div className="relative order-2 lg:order-1">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Collections pipeline</p>
                        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300">
                          <ArrowRight className="h-3 w-3" />Export CSV
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] overflow-hidden">
                        <div className="grid grid-cols-4 gap-0 border-b border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          <span>Client</span><span>Amount</span><span>Status</span><span>Last follow-up</span>
                        </div>
                        {[
                          {name:"Sarah Okafor",amount:"$2,400",status:"Overdue",statusColor:"text-red-400",fu:"Email · May 18"},
                          {name:"Marcus Reid",amount:"$1,200",status:"Partial",statusColor:"text-blue-300",fu:"Call · May 21"},
                          {name:"David Anand",amount:"$4,200",status:"Promised",statusColor:"text-amber-300",fu:"WhatsApp · May 22"},
                        ].map((r) => (
                          <div key={r.name} className="grid grid-cols-4 gap-0 border-b border-white/5 px-3 py-2.5 text-xs">
                            <span className="font-medium text-zinc-200">{r.name}</span>
                            <span className="text-zinc-300">{r.amount}</span>
                            <span className={r.statusColor}>{r.status}</span>
                            <span className="text-zinc-500">{r.fu}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-zinc-600">duely-export-2025-05-25.csv · 3 rows · Downloaded</p>
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
              <FadeIn delay={0.2} className="order-1 lg:order-2 max-w-xl lg:pl-12 xl:pl-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 mb-6">
                  <ArrowRight className="h-6 w-6 text-amber-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Your data is yours. Always.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  One click exports your entire client list — with balances, statuses, due dates, and follow-up history — to a CSV file. No lock-in.
                </p>
              </FadeIn>
            </div>
          </Container>
        </section>

        {/* SOCIAL PROOF */}
        <section className="py-24 border-b border-white/5 bg-zinc-950/30">
          <Container>
            <FadeIn>
              <div className="mx-auto max-w-4xl flex flex-col items-center justify-center rounded-2xl bg-zinc-900/50 border border-white/10 p-8 sm:p-12 text-center shadow-xl backdrop-blur-sm">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-5 w-5 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-zinc-100 mb-8 leading-snug">
                  &quot;This is what you call a complete product.&quot;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold">
                    S
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-zinc-200">Samiksha</div>
                    <div className="text-sm text-zinc-500">Former Agency Owner</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </Container>
        </section>

        {/* WORKS WITH */}
        <section className="py-16 border-b border-white/5 bg-zinc-950 text-center">
          <Container>
            <FadeIn>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-6">Works with</h3>
              <div className="flex flex-wrap justify-center items-center gap-3 text-zinc-400">
                {["QuickBooks", "Xero", "Stripe (Beta)", "Gmail"].map((tool) => (
                  <div key={tool} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-medium">{tool}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </Container>
        </section>

        {/* PRICING SECTION */}
        <section className="py-24 sm:py-32 bg-background relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.05),transparent_50%)]" />
          <Container>
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                Simple, transparent pricing.
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                No complex tiers. No hidden fees. Try it free for 7 days.
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
              <FadeIn>
                <Card className="h-full border-white/10 bg-white/[0.02] relative overflow-hidden group">
                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-zinc-100">Free Trial</CardTitle>
                    <div className="mt-4 text-sm text-zinc-400">7 days, no card required</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="mt-8 space-y-4 text-sm text-zinc-300">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        Full access to everything
                      </li>
                    </ul>
                    <p className="mt-6 text-sm text-zinc-500 leading-relaxed">
                      After 7 days you&apos;ll be asked to subscribe. Your data is always yours — export anytime.
                    </p>
                    <div className="mt-10">
                      <Link href="/signup">
                        <Button variant="secondary" className="w-full">Start trial</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.1}>
                <Card className="h-full border-indigo-500/20 bg-indigo-500/[0.02] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-zinc-100">Pro</CardTitle>
                    <div className="mt-4 flex items-baseline text-4xl font-semibold text-zinc-50">
                      $29
                      <span className="ml-1 text-base font-normal text-zinc-500">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="mt-8 space-y-4 text-sm text-zinc-300">
                      {[
                        "Unlimited clients",
                        "Promise and partial payment tracking",
                        "Follow-up logging with timeline",
                        "Message drafting by tone — friendly, firm, or final notice",
                        "Automated reminders sent from your own Gmail",
                        "QuickBooks and Xero integration",
                        "Stripe sync (Beta)",
                        "CSV export"
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-10">
                      <Link href="/signup">
                        <Button className="w-full shadow-lg shadow-indigo-500/20">Subscribe now</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </Container>
        </section>

        {/* LIFETIME DEAL */}
        <LifetimeDealSection spotsLeft={spotsLeft} />

        {/* FOUNDER NOTE */}
        <section className="py-24 sm:py-32 border-t border-white/5 bg-zinc-950/50">
          <Container>
            <FadeIn>
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] mb-8">
                  <User className="h-8 w-8 text-zinc-400" />
                </div>
                <blockquote className="text-lg leading-relaxed text-zinc-400">
                  &quot;I built Duely because I watched people lose thousands to payment awkwardness — not bad clients, just no system. I&apos;m building this seriously and in public (<a href="https://x.com/AbhishekU008" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">follow along here</a>).<br /><br />
                  If you have feedback — <a href="mailto:abhishek@duely.in" className="text-indigo-400 hover:text-indigo-300 transition-colors">abhishek@duely.in</a><br />
                  — Abhishek&quot;
                </blockquote>
              </div>
            </FadeIn>
          </Container>
        </section>

        {/* FROM THE BLOG */}
        <section className="py-24 sm:py-32 border-t border-white/5 bg-zinc-950">
          <Container>
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                From the blog
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                Actionable advice on managing receivables and getting paid faster.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
              {[
                {
                  title: "How to Write a Demand Letter as a Consultant",
                  desc: "When a client ignores your invoices, a demand letter is your next step. Here's how to write one professionally.",
                  readTime: "6 min read",
                  link: "/articles/how-to-write-a-demand-letter-as-a-consultant",
                },
                {
                  title: "How to Track Payment Promises from Clients",
                  desc: "If a client promises to pay on Friday, how do you hold them to it without sounding like a debt collector? Here's the framework.",
                  readTime: "5 min read",
                  link: "/articles/how-to-track-payment-promises-from-clients",
                },
                {
                  title: "What to Say When a Client Misses a Deadline",
                  desc: "Email templates and scripts for following up on late payments without ruining the client relationship.",
                  readTime: "7 min read",
                  link: "/articles/what-to-say-when-a-client-misses-a-payment-deadline",
                },
              ].map((post, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <Link href={post.link} className="group block h-full">
                    <Card className="h-full border-white/10 bg-white/[0.02] transition-colors group-hover:bg-white/[0.04]">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="text-xs text-indigo-300 font-medium mb-3">{post.readTime}</div>
                        <h3 className="text-xl font-semibold text-zinc-100 mb-3 group-hover:text-indigo-400 transition-colors">{post.title}</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed flex-1">{post.desc}</p>
                        <div className="mt-6 flex items-center text-sm font-medium text-indigo-400">
                          Read article <ArrowRight className="ml-1 h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </Container>
        </section>

        {/* FAQ SECTION */}
        <section className="py-24 sm:py-32 border-t border-white/5 bg-zinc-950">
          <Container>
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl text-center mb-12">
                Frequently asked questions
              </h2>
              <div className="space-y-8">
                {[
                  {
                    q: "How is this different from Stripe?",
                    a: "Stripe processes payments. Duely handles everything that happens before a client actually pays — the follow-ups, the promises, the context, the relationship. They do different jobs."
                  },
                  {
                    q: "How is this different from the Stripe dashboard?",
                    a: "The Stripe dashboard shows you who hasn't paid. Duely helps you do something about it — without the awkwardness."
                  },
                  {
                    q: "Who sends the reminder emails?",
                    a: "You do. Duely connects to your Gmail account and sends reminders from your own email address. Your clients never see Duely's name."
                  },
                  {
                    q: "Does this work with QuickBooks or Xero?",
                    a: "Yes. Connect your QuickBooks or Xero account and Duely automatically imports your outstanding invoices and syncs payment status. When a client pays, Duely stops chasing them."
                  },
                  {
                    q: "Can I track what's been said to each client?",
                    a: "Yes. Every follow-up, promise, partial payment, and note is logged in a timeline per client so you always know exactly where things stand before reaching out."
                  },
                  {
                    q: "Can I edit the reminder emails before they go out?",
                    a: "Yes. Duely drafts the message based on the tone you choose — friendly, firm, or final notice — and you can edit it before anything is sent."
                  },
                  {
                    q: "Where is my data stored?",
                    a: "Securely in the cloud. Your client data is private to your account and never shared."
                  },
                  {
                    q: "Can I export my data?",
                    a: "Yes — CSV export available anytime."
                  },
                  {
                    q: "What if a client replies to the reminder email instead of clicking the payment button?",
                    a: "Just hit \"Pause reminders\" on that client in your Duely dashboard. One click stops the sequence while you handle the conversation manually."
                  },
                  {
                    q: "Does this work without Stripe?",
                    a: "Yes. Stripe sync is optional. Duely works with any invoicing tool or none at all."
                  }
                ].map((faq, i) => (
                  <FadeIn key={i} delay={i * 0.05}>
                    <div>
                      <h3 className="text-lg font-medium text-zinc-100">{faq.q}</h3>
                      <p className="mt-2 text-zinc-400 leading-relaxed">{faq.a}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* CTA SECTION */}
        <section className="relative py-24 sm:py-32 overflow-hidden border-t border-white/5 bg-background">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-0 -ml-[40rem] h-[40rem] w-[80rem] rounded-full bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] mix-blend-overlay" />
          </div>

          <Container>
            <SlideUp>
              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h2 className="text-pretty text-4xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-5xl">
                  Ready to organize your receivables?
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Stop chasing clients out of your inbox and start collecting payments professionally.
                </p>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-indigo-500/20 w-full sm:w-auto">
                      Start free trial — no card required
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/tools" className="w-full sm:w-auto">
                    <Button variant="secondary" size="lg" className="h-12 px-8 text-base w-full sm:w-auto">
                      Explore free tools
                    </Button>
                  </Link>
                </div>
              </div>
            </SlideUp>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
