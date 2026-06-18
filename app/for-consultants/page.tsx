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
  title: "Payment Tracking for Independent Consultants | Duely",
  description: "Protect your consulting relationships by automating your invoice follow-ups and tracking payment promises effortlessly.",
  alternates: {
    canonical: "/for-consultants",
  },
};

export default async function ForConsultantsPage({
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
                  You provide high-level consulting. Stop doing low-level debt collection.
                </h1>
                <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400">
                  Protect your consulting relationships by automating your invoice follow-ups and tracking payment promises effortlessly.
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

        {/* PROBLEM SECTION */}
        <section className="py-24 sm:py-32 border-y border-white/5 bg-zinc-950/50">
          <Container>
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                The collections gap
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              
              <FadeIn delay={0.0}>
                <Card className="h-full border-white/10 bg-white/[0.02]">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 mb-4">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <p className="text-zinc-300 font-medium">You have one big retainer client who always pays late.</p>
                  </CardContent>
                </Card>
              </FadeIn>
              <FadeIn delay={0.1}>
                <Card className="h-full border-white/10 bg-white/[0.02]">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 mb-4">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <p className="text-zinc-300 font-medium">You're not sure if you followed up last week or two weeks ago.</p>
                  </CardContent>
                </Card>
              </FadeIn>
              <FadeIn delay={0.2}>
                <Card className="h-full border-white/10 bg-white/[0.02]">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 mb-4">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <p className="text-zinc-300 font-medium">You don't want to feel like a debt collector.</p>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </Container>
        </section>

        {/* FEATURES SECTION */}
        <section className="relative overflow-hidden py-24 sm:py-32 space-y-32 sm:space-y-40 bg-zinc-950/50 border-y border-white/5 backdrop-blur-sm">
          
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 mb-6">
                  <Zap className="h-6 w-6 text-indigo-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Track payment promises easily.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  When a consulting client says they're waiting on budget approval, log it. Duely remembers so you don't have to.
                </p>
              </FadeIn>
            </div>
          </Container>
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 mb-6">
                  <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Draft tactful follow-up messages.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Maintain your professional consulting relationship by selecting a polite but firm tone for your follow-ups.
                </p>
              </FadeIn>
            </div>
          </Container>
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 mb-6">
                  <CreditCard className="h-6 w-6 text-amber-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Track partial retainer payments.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Consulting retainers can get messy. Log every partial payment and always know the exact outstanding balance.
                </p>
              </FadeIn>
            </div>
          </Container>
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 mb-6">
                  <MessageSquare className="h-6 w-6 text-sky-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Automated reminders on autopilot.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  You're a consultant, not a collections agent. Let Duely automatically follow up on your behalf.
                </p>
              </FadeIn>
            </div>
          </Container>
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 mb-6">
                  <ShieldCheck className="h-6 w-6 text-purple-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Emails sent from your personal domain.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Maintain your premium consulting brand. Reminders are sent directly from your connected Gmail account.
                </p>
              </FadeIn>
            </div>
          </Container>
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 mb-6">
                  <Zap className="h-6 w-6 text-amber-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Full timeline of client interactions.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Before your next consulting call, review exactly when you last reminded them and what they promised.
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

        {/* PRICING SECTION */}
        <section className="py-24 sm:py-32 bg-background relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.05),transparent_50%)]" />
          <Container>
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                Simple, transparent pricing.
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                No complex tiers. No hidden fees. Try it free for 14 days.
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
              <FadeIn>
                <Card className="h-full border-white/10 bg-white/[0.02] relative overflow-hidden group">
                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-zinc-100">Free Trial</CardTitle>
                    <div className="mt-4 text-sm text-zinc-400">14 days, no card required</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="mt-8 space-y-4 text-sm text-zinc-300">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        Full access to everything
                      </li>
                    </ul>
                    <p className="mt-6 text-sm text-zinc-500 leading-relaxed">
                      After 14 days you&apos;ll be asked to subscribe. Your data is always yours — export anytime.
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

        {/* FAQ SECTION */}
        <section className="py-24 sm:py-32 border-t border-white/5 bg-zinc-950">
          <Container>
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl text-center mb-12">
                Frequently asked questions
              </h2>
              <div className="space-y-8">
                
                  <FadeIn key={0} delay={0 * 0.05}>
                    <div>
                      <h3 className="text-lg font-medium text-zinc-100">I only have a few high-ticket clients. Do I need this?</h3>
                      <p className="mt-2 text-zinc-400 leading-relaxed">Yes. Losing track of a high-ticket invoice is costly, and following up manually can strain your key relationships.</p>
                    </div>
                  </FadeIn>
                  <FadeIn key={1} delay={1 * 0.05}>
                    <div>
                      <h3 className="text-lg font-medium text-zinc-100">Will my clients feel like they're being hounded?</h3>
                      <p className="mt-2 text-zinc-400 leading-relaxed">No. Duely helps you draft perfectly toned, professional emails sent straight from your own email address.</p>
                    </div>
                  </FadeIn>
                  <FadeIn key={2} delay={2 * 0.05}>
                    <div>
                      <h3 className="text-lg font-medium text-zinc-100">Can I pause reminders if a client reaches out to me directly?</h3>
                      <p className="mt-2 text-zinc-400 leading-relaxed">Yes. One click pauses the automated sequence so you can handle the situation personally.</p>
                    </div>
                  </FadeIn>
                  <FadeIn key={3} delay={3 * 0.05}>
                    <div>
                      <h3 className="text-lg font-medium text-zinc-100">Does this work for milestone-based billing?</h3>
                      <p className="mt-2 text-zinc-400 leading-relaxed">Absolutely. You can track individual invoices and partial payments against your consulting milestones.</p>
                    </div>
                  </FadeIn>
                  <FadeIn key={4} delay={4 * 0.05}>
                    <div>
                      <h3 className="text-lg font-medium text-zinc-100">Can I export my data for my accountant?</h3>
                      <p className="mt-2 text-zinc-400 leading-relaxed">Yes, you can export your entire collections pipeline to a CSV at any time.</p>
                    </div>
                  </FadeIn>
              </div>
            </div>
          </Container>
        </section>

        {/* CTA SECTION */}
        <section className="relative py-24 sm:py-32 overflow-hidden border-t border-white/5 bg-background">
          <Container>
            <SlideUp>
              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h2 className="text-pretty text-4xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-5xl">
                  Ready to organize your receivables?
                </h2>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row justify-center">
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-indigo-500/20 w-full sm:w-auto">
                      Start free trial — no card required
                      <ArrowRight className="ml-2 h-4 w-4" />
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
