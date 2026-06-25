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
      icon: "⚡",
      title: "Action Center",
      desc: "A daily prioritized queue of who to contact — ranked by invoice aging, financial risk, and broken promises. No more guessing who to chase.",
    },
    {
      icon: "📊",
      title: "Collections Pipeline",
      desc: "Kanban-style board showing every client across Outstanding, Overdue, and Paid stages. See your entire AR at a glance.",
    },
    {
      icon: "📈",
      title: "Analytics & Trends",
      desc: "Collection trend charts, monthly revenue collected, and overdue aging breakdowns — so you always know where you stand.",
    },
    {
      icon: "✉️",
      title: "Smart follow-up drafting",
      desc: "Generate follow-up emails in one click. Pick a tone — Friendly, Professional, or Firm — and send directly from your own Gmail.",
    },
    {
      icon: "🔔",
      title: "Automated reminders",
      desc: "Set a recurring schedule or a multi-step email sequence. Duely sends reminders automatically and pauses the moment you step in manually.",
    },
    {
      icon: "🤝",
      title: "Payment promise tracking",
      desc: "Log when a client promises to pay and by when. Duely surfaces broken promises in the Action Center so nothing slips through.",
    },
    {
      icon: "💳",
      title: "Partial payment logging",
      desc: "Record partial payments with a running balance and progress bar. Know exactly how much is still owed on every invoice.",
    },
    {
      icon: "📋",
      title: "Activity timeline",
      desc: "A full chronological log of every call, email, WhatsApp message, and payment — per client. Complete context, always.",
    },
    {
      icon: "🏦",
      title: "Late fee automation",
      desc: "Configure a flat or percentage late fee policy with grace periods and recurring frequencies. Duely applies fees automatically.",
    },
    {
      icon: "👥",
      title: "Client groups",
      desc: "Organise clients into groups with custom tags. Exclude VIP accounts from automation or apply tighter policies to chronic late-payers.",
    },
    {
      icon: "🔒",
      title: "Client portal",
      desc: "Give clients a secure, branded link to view their outstanding balance, download past invoices, and pay — without emailing you first.",
    },
    {
      icon: "🔗",
      title: "Accounting integrations",
      desc: "Sync invoices directly from Xero, QuickBooks, or Stripe. No CSV uploads, no manual data entry.",
    },
    {
      icon: "📧",
      title: "Gmail integration",
      desc: "Send follow-ups from your own Gmail address. Emails land in the client's inbox from you — not from a no-reply bot.",
    },
    {
      icon: "⏸️",
      title: "Smart cooldowns",
      desc: "When you log a manual call or message, the automated sequence automatically pauses. Duely knows when to step back.",
    },
    {
      icon: "📝",
      title: "Internal notes",
      desc: "Add private notes to any client record — context about their situation, promises they made, or anything else you need to remember.",
    },
    {
      icon: "📤",
      title: "CSV export",
      desc: "Export your full collections pipeline to CSV at any time. Your data, your format, no lock-in.",
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
          <Container className="max-w-6xl">
            <div className="mb-14 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
                Everything in one place
              </h2>
              <p className="mt-3 text-zinc-500 max-w-lg mx-auto">
                Built for freelancers and agencies who are done chasing payments
                manually. Every feature you need, nothing you don&apos;t.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <span className="text-xl">{f.icon}</span>
                  <h3 className="mt-3 text-sm font-semibold text-zinc-100">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
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
