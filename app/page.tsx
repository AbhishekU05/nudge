import type { Metadata } from "next";
import Script from "next/script";
import { redirect } from "next/navigation";

import { AuthErrorRedirect } from "@/components/site/auth-error-redirect";
import { Container } from "@/components/site/container";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

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

  const features = [
    {
      label: "01",
      title: "Action Center",
      desc: "A daily prioritized queue of who to contact, ranked by invoice aging, financial risk, and broken promises. Stop guessing who to chase — Duely tells you.",
    },
    {
      label: "02",
      title: "Automated reminders",
      desc: "Set a recurring schedule or a multi-step email sequence. Reminders go out automatically. The moment you step in manually, the sequence pauses.",
    },
    {
      label: "03",
      title: "Follow-up drafting",
      desc: "Generate a follow-up email in one click. Pick a tone — Friendly, Professional, or Firm — and send it from your own Gmail address.",
    },
    {
      label: "04",
      title: "Late fee automation",
      desc: "Set a flat or percentage late fee policy once. Duely applies it automatically on chronically late invoices — so you can blame the system, not yourself.",
    },
    {
      label: "05",
      title: "Client portal",
      desc: "Give clients a secure link to view their balance, download past invoices, and pay directly. No more 'can you resend the invoice?' emails.",
    },
    {
      label: "06",
      title: "Accounting integrations",
      desc: "Sync invoices directly from Xero, QuickBooks, or Stripe. Your pipeline stays up to date without any manual data entry.",
    },
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
          <Container className="max-w-4xl">
            <div className="mb-16">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
                Built around how collections actually works
              </h2>
              <p className="mt-3 text-zinc-500 max-w-md">
                Every feature is designed to get you paid faster without damaging
                the relationship.
              </p>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="grid grid-cols-[2rem_1fr] gap-x-8 py-8 sm:grid-cols-[2rem_1fr_1fr]"
                >
                  <span className="text-xs font-medium tabular-nums text-zinc-600 pt-0.5">
                    {f.label}
                  </span>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:mt-0 col-start-2 sm:col-start-3">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
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
