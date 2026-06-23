import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";

import { AuthErrorRedirect } from "@/components/site/auth-error-redirect";
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
  User
} from "lucide-react";
import { websiteSchema } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Collect what you're owed, keep the relationship",
  description: "Track outstanding invoices, payment promises, partial payments, and follow-ups. Collections management built for freelancers and agencies.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Collect what you're owed, keep the relationship",
    description: "Track outstanding invoices, payment promises, partial payments, and follow-ups. Collections management built for freelancers and agencies.",
    url: "https://duely.in/",
    type: "website",
    images: [
      {
        url: "https://duely.in/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Collect what you're owed, keep the relationship",
    description: "Track outstanding invoices, payment promises, partial payments, and follow-ups.",
    images: ["https://duely.in/og-image.png"],
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    error_code?: string;
    error_description?: string;
  }>;
}) {
  const { error, error_description: errorDescription } = await searchParams;

  if (error || errorDescription) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        getEmailLinkErrorMessage(errorDescription ?? error),
      )}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const spotsLeft = await getRemainingLifetimeSpots();

  if (user) {
    redirect("/dashboard");
  }

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Duely",
    url: "https://duely.in",
    logo: "https://duely.in/logo.svg",
    description:
      "collections management tool for freelancers and small agencies. Track outstanding invoices, payment promises, partial payments, and automate follow-ups.",
    sameAs: ["https://x.com/AbhishekU008"],
    contactPoint: {
      "@type": "ContactPoint",
      email: "abhishek@duely.in",
      contactType: "customer support",
    },
  };

  const softwareApplicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Duely",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "29",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1M",
      },
    },
    description:
      "Collections management tool for freelancers and small agencies. Invoice follow-up tracking, payment promise logging, partial payment management.",
  };

  const homeSchemas = [
    organizationJsonLd,
    {
      "@context": "https://schema.org",
      ...websiteSchema,
    },
    softwareApplicationJsonLd,
  ];

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      {homeSchemas.map((schema, index) => (
        <Script
          key={index}
          id={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}
      <AuthErrorRedirect />
      <SiteHeader />

      <main id="main-content" className="flex-1">
                {/* PAGE HEADER */}
        <section className="relative pt-12 pb-10 sm:pt-16 sm:pb-20">
          <Container className="text-center">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">All Features</h1>
            <p className="mt-4 text-lg text-zinc-400">Everything you need to automate collections and protect client relationships.</p>
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

          {/* Section 9: Analytics */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12 xl:pr-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 mb-6">
                  <Sparkles className="h-6 w-6 text-blue-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Know exactly how much money is trapped in unpaid invoices, at a glance.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  The Analytics tab gives you a real-time dashboard of your agency's health. See your average time-to-pay, aging reports, and collection rate over time without ever running a manual report again.
                </p>
              </FadeIn>
              <SlideIn right delay={0.2} className="flex justify-center">
                <div className="relative w-full max-w-[26rem]">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.07),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Analytics</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
                          <p className="text-xs text-zinc-500">Total Outstanding</p>
                          <p className="text-xl font-bold text-zinc-100 mt-1">$42,500</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
                          <p className="text-xs text-zinc-500">Average Time to Pay</p>
                          <p className="text-xl font-bold text-zinc-100 mt-1">14 days</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 space-y-3 mt-3">
                        <p className="text-xs text-zinc-500 mb-2">Aging Report</p>
                        {[
                          {label:"Current",amount:"$12,000",pct:"w-[30%]"},
                          {label:"1-30 days",amount:"$15,500",pct:"w-[40%]"},
                          {label:"31-60 days",amount:"$10,000",pct:"w-[20%]"},
                          {label:"60+ days",amount:"$5,000",pct:"w-[10%]"}
                        ].map((row) => (
                          <div key={row.label} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-zinc-400">{row.label}</span>
                              <span className="text-zinc-200 font-medium">{row.amount}</span>
                            </div>
                            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                              <div className={`h-full bg-blue-500 rounded-full ${row.pct}`} />
                            </div>
                          </div>
                        ))}
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

          {/* Section 11: Weekly Digest Email */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12 xl:pr-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-pink-500/20 bg-pink-500/10 mb-6">
                  <Mail className="h-6 w-6 text-pink-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Start your week knowing exactly who to chase.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Every Monday morning, Duely drops a beautifully formatted digest straight into your inbox. It summarizes exactly what you collected last week, who broke a payment promise, and which invoices just became overdue so you can prioritize your time.
                </p>
              </FadeIn>
              <SlideIn right delay={0.2} className="flex justify-center">
                <div className="relative w-full max-w-[26rem]">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.06),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-4 shadow-xl shadow-black/20">
                    <CardContent className="p-0 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-zinc-400" />
                        <p className="text-xs font-medium text-zinc-400">Weekly Digest · Monday 8:00 AM</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
                        <div>
                          <p className="text-lg font-bold text-zinc-100">Your Weekly Collections Briefing</p>
                          <p className="text-sm text-zinc-400 mt-1">Here is what happened last week and what needs attention.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Collected last week</p>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-emerald-400">$18,400.00</p>
                              <p className="text-xs text-zinc-500">Across 4 invoices</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Action needed</p>
                          <div className="rounded border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm">
                            <p className="font-medium text-red-200">Acme Corp ($4,200)</p>
                            <p className="text-xs text-red-300/70 mt-0.5">Missed their payment promise on Friday.</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
            </div>
          </Container>

        {/* WORKS WITH */}
        <section className="py-16 border-b border-white/5 bg-zinc-950 text-center">
          <Container>
            <FadeIn>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-6">Works with</h3>
              <div className="flex flex-wrap justify-center items-center gap-3 text-zinc-400">
                {["QuickBooks", "Xero", "Gmail"].map((tool) => (
                  <div key={tool} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-medium">{tool}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </Container>
        </section>

              </main>

      <SiteFooter />
    </div>
  );
}
