import type { Metadata } from "next";
import Script from "next/script";
import { redirect } from "next/navigation";

import { AuthErrorRedirect } from "@/components/site/auth-error-redirect";
import { Container } from "@/components/site/container";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { FeatureFadeIn } from "@/components/site/feature-fade-in";

import { getEmailLinkErrorMessage } from "@/lib/auth-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { websiteSchema } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Collect what you're owed, keep the relationship",
  description:
    "Track outstanding invoices, payment promises, partial payments, and follow-ups. Collections management built for freelancers and agencies.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Collect what you're owed, keep the relationship",
    description:
      "Track outstanding invoices, payment promises, partial payments, and follow-ups. Collections management built for freelancers and agencies.",
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
    description:
      "Track outstanding invoices, payment promises, partial payments, and follow-ups.",
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

        {/* ── Hero ── */}
        <section className="py-28 sm:py-36">
          <Container className="max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-indigo-400">
              For freelancers &amp; agencies
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Your invoices are overdue.
              <br />
              <span className="text-zinc-400">Your time shouldn&apos;t be.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-400 max-w-xl mx-auto">
              Duely tracks every outstanding invoice, automates follow-ups, and
              tells you exactly who to chase today — so you can get paid without
              the awkward back-and-forth.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/signup"
                className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
              >
                Get started free
              </a>
              <a
                href="/how-it-works"
                className="inline-flex items-center rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:text-zinc-50"
              >
                See how it works
              </a>
            </div>
          </Container>
        </section>

        {/* ── Features ── */}
        <section className="border-t border-white/5 py-20 sm:py-28">
          <Container className="max-w-7xl">
            {/* center path line — only visible on sm+ */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-1/2 sm:block">
                <div className="h-full w-px bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />
              </div>

              {/* ── Action Center ── */}
              <FeatureFadeIn delay={0}>
                <div className="relative grid gap-16 py-20 sm:grid-cols-2 sm:items-center">
                  {/* path node */}
                  <div className="pointer-events-none absolute bottom-0 left-1/2 hidden -translate-x-1/2 translate-y-1/2 sm:flex items-center justify-center z-10">
                    <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">Action Center</p>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
                      Stop guessing who to chase.
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-zinc-400">
                      Every morning, Duely scores your entire client list by invoice
                      aging, financial risk, and broken promises — and gives you a
                      prioritized queue of exactly who needs a nudge today.
                      No spreadsheets, no gut feel.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-zinc-400">Today&apos;s queue</span>
                      <span className="text-xs text-zinc-600">3 actions</span>
                    </div>
                    <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Critical</span>
                        <span className="text-xs text-zinc-500">Acme Corp · $15,400</span>
                      </div>
                      <p className="text-sm text-zinc-300">Follow up on broken promise — 18 days overdue</p>
                      <div className="mt-3 inline-flex items-center rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-300">Send firm follow-up</div>
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Moderate</span>
                        <span className="text-xs text-zinc-500">Initech LLC · $2,150</span>
                      </div>
                      <p className="text-sm text-zinc-300">14 days overdue — no broken promises yet</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 bg-white/5 px-2 py-0.5 rounded">Chill</span>
                        <span className="text-xs text-zinc-500">Stark Industries · $12,000</span>
                      </div>
                      <p className="text-sm text-zinc-500">Only 2 days late. Good payer — they probably forgot.</p>
                    </div>
                  </div>
                </div>
              </FeatureFadeIn>

              {/* ── Automated Reminders ── */}
              <FeatureFadeIn delay={80}>
                <div className="relative grid gap-16 py-20 sm:grid-cols-2 sm:items-center">
                  <div className="pointer-events-none absolute bottom-0 left-1/2 hidden -translate-x-1/2 translate-y-1/2 sm:flex items-center justify-center z-10">
                    <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 order-last sm:order-first">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-sm font-semibold text-zinc-300">Invoice automation</span>
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">Active</span>
                    </div>
                    <div className="space-y-4">
                      {[
                        { day: "Day 3", label: "Friendly reminder", done: true },
                        { day: "Day 7", label: "Professional nudge", done: true },
                        { day: "Day 14", label: "Firm warning", done: false },
                      ].map((step) => (
                        <div key={step.day} className="flex items-center gap-4">
                          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                            step.done ? "bg-indigo-500" : "bg-zinc-700"
                          }`} />
                          <span className="text-xs text-zinc-600 w-12">{step.day}</span>
                          <span className={`text-sm ${
                            step.done ? "text-zinc-300" : "text-zinc-600"
                          }`}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 pt-5 border-t border-white/[0.05] flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                      <span className="text-xs text-zinc-500">Paused — you logged a manual call today</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">Automated reminders</p>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
                      Set it once. Let it run.
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-zinc-400">
                      Configure a recurring schedule or a multi-step email sequence.
                      Reminders go out on autopilot — and the moment you log a
                      manual call or message, the sequence pauses automatically
                      so you never sound out of touch.
                    </p>
                  </div>
                </div>
              </FeatureFadeIn>

              {/* ── Gmail integration ── */}
              <FeatureFadeIn delay={80}>
                <div className="relative grid gap-16 py-20 sm:grid-cols-2 sm:items-center">
                  <div className="pointer-events-none absolute bottom-0 left-1/2 hidden -translate-x-1/2 translate-y-1/2 sm:flex items-center justify-center z-10">
                    <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">Gmail integration</p>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
                      Emails from you, not a bot.
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-zinc-400">
                      Connect your Gmail and every follow-up lands in the
                      client&apos;s inbox as a regular email from your address —
                      not from a no-reply system. Replies go straight to your
                      inbox, keeping the conversation natural.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-zinc-300">G</div>
                      <span className="text-sm font-medium text-zinc-300">you@gmail.com</span>
                      <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Connected</span>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3 text-sm">
                      <div className="flex gap-4">
                        <span className="w-10 text-zinc-600">To</span>
                        <span className="text-zinc-300">sarah@acmecorp.com</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="w-10 text-zinc-600">From</span>
                        <span className="text-zinc-300">you@gmail.com</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="w-10 text-zinc-600">Re</span>
                        <span className="text-zinc-400">Invoice #1042 — outstanding balance</span>
                      </div>
                      <div className="border-t border-white/[0.05] pt-3 text-zinc-500">
                        Hi Sarah, just a quick follow-up on invoice #1042...
                      </div>
                    </div>
                  </div>
                </div>
              </FeatureFadeIn>

              {/* ── Late fee automation ── */}
              <FeatureFadeIn delay={80}>
                <div className="relative grid gap-16 py-20 sm:grid-cols-2 sm:items-center">
                  <div className="pointer-events-none absolute bottom-0 left-1/2 hidden -translate-x-1/2 translate-y-1/2 sm:flex items-center justify-center z-10">
                    <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 order-last sm:order-first">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-sm font-semibold text-zinc-300">Late fee policy</span>
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">Enabled</span>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: "Type", value: "Percentage" },
                        { label: "Rate", value: "5% per month" },
                        { label: "Grace period", value: "14 days" },
                        { label: "Frequency", value: "Monthly" },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between">
                          <span className="text-sm text-zinc-500">{row.label}</span>
                          <span className="text-sm text-zinc-300">{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 pt-5 border-t border-white/[0.05]">
                      <p className="text-xs text-zinc-600">Next application in 4 days</p>
                      <p className="text-sm text-zinc-400 mt-1">Acme Corp — $772 late fee will be logged</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">Late fee automation</p>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
                      Charge late fees without the awkward conversation.
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-zinc-400">
                      Configure a flat or percentage late fee policy once — with
                      grace periods and recurring frequencies. Duely applies it
                      automatically to chronically late invoices. Blame the
                      system, not yourself.
                    </p>
                  </div>
                </div>
              </FeatureFadeIn>

              {/* ── Client portal ── */}
              <FeatureFadeIn delay={80}>
                <div className="relative grid gap-16 py-20 sm:grid-cols-2 sm:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">Client portal</p>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
                      Give clients a way to help themselves.
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-zinc-400">
                      Share a secure link with any client. They can view their
                      outstanding balance, download past invoices, and pay
                      directly — no more &ldquo;can you resend the invoice?&rdquo; emails,
                      no more payment link ping-pong.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6">
                    <div className="mb-5">
                      <p className="text-xs uppercase tracking-widest text-zinc-600">Client view</p>
                      <p className="text-sm font-medium text-zinc-400 mt-1.5">Outstanding balance</p>
                      <p className="text-4xl font-bold text-zinc-50 mt-1">$8,200</p>
                    </div>
                    <div className="space-y-2.5 mb-5">
                      <div className="flex justify-between items-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <span className="text-sm text-zinc-400">Invoice #1041</span>
                        <span className="text-sm text-red-400">$5,000 · 32d overdue</span>
                      </div>
                      <div className="flex justify-between items-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <span className="text-sm text-zinc-400">Invoice #1042</span>
                        <span className="text-sm text-amber-400">$3,200 · 14d overdue</span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white">
                      Pay now
                    </div>
                  </div>
                </div>
              </FeatureFadeIn>

            </div>{/* end relative path wrapper */}
          </Container>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="border-t border-white/5 py-20 sm:py-28">
          <Container className="max-w-4xl">
            <div className="mb-14 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
                Simple, honest pricing
              </h2>
              <p className="mt-3 text-zinc-500">
                One plan. Everything included. Cancel any time.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Free */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8">
                <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
                  Free
                </p>
                <p className="mt-4 text-4xl font-bold text-zinc-50">$0</p>
                <p className="mt-1 text-sm text-zinc-500">Forever</p>
                <ul className="mt-8 space-y-3 text-sm text-zinc-400">
                  {[
                    "Up to 5 active clients",
                    "Manual follow-up drafting",
                    "Activity timeline",
                    "Payment promise tracking",
                    "CSV export",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-indigo-400">✓</span> {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="/signup"
                  className="mt-8 block rounded-lg border border-white/10 py-3 text-center text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:text-zinc-50"
                >
                  Get started
                </a>
              </div>

              {/* Pro */}
              <div className="relative rounded-xl border border-indigo-500/40 bg-indigo-500/[0.06] p-8">
                <span className="absolute right-5 top-5 rounded-full bg-indigo-600/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                  Most popular
                </span>
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
                  Pro
                </p>
                <p className="mt-4 text-4xl font-bold text-zinc-50">$29</p>
                <p className="mt-1 text-sm text-zinc-500">per month</p>
                <ul className="mt-8 space-y-3 text-sm text-zinc-400">
                  {[
                    "Unlimited clients",
                    "Action Center",
                    "Automated reminders & sequences",
                    "Late fee automation",
                    "Client portal",
                    "Client groups & segmentation",
                    "Xero, QuickBooks & Stripe sync",
                    "Gmail integration",
                    "Analytics & trend charts",
                    "Priority support",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-indigo-400">✓</span> {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="/signup"
                  className="mt-8 block rounded-lg bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
                >
                  Start free trial
                </a>
              </div>
            </div>
          </Container>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
