import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Zap,
  ShieldCheck,
  Heart,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";

import { Container } from "@/components/site/container";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = {
  title: "About — Duely",
  description:
    "Learn why Duely was built, what we believe, and who we built it for — the independent professionals and small teams who deserve to get paid.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    icon: Zap,
    title: "Speed over ceremony",
    body: "Every screen is designed for the person who has five minutes, not five hours. Fast to load, fast to act on.",
  },
  {
    icon: ShieldCheck,
    title: "Professional by default",
    body: "Every reminder that goes out looks like it came from a real business — because it did. Your reputation travels with every email.",
  },
  {
    icon: Heart,
    title: "Relationships first",
    body: "Collecting money is awkward. We write defaults that nudge firmly but never burn bridges. You keep the client after they pay.",
  },
  {
    icon: TrendingUp,
    title: "Visibility, not guesswork",
    body: "A clear picture of your AR is worth more than any reminder template. Know who owes what, and for how long, at a glance.",
  },
  {
    icon: Clock,
    title: "Time is the real asset",
    body: "Manual follow-up is a tax on your week. Automation should handle the routine so you only step in when it actually matters.",
  },
  {
    icon: Users,
    title: "Built for small teams",
    body: "Not a watered-down enterprise tool. Every feature is sized for one to ten people running a real services business.",
  },
];

const audiences = [
  {
    label: "Freelancers",
    slug: "freelancers",
    desc: "Solo operators who need a professional, low-effort system to recover overdue invoices without chasing clients every week.",
    accent: "from-indigo-500/20 to-violet-500/10",
    border: "border-indigo-500/20",
  },
  {
    label: "Small agencies",
    slug: "agencies",
    desc: "Teams of 2–15 people juggling multiple client accounts, retainers, and project invoices that need a unified AR view.",
    accent: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/20",
  },
  {
    label: "Consultants",
    slug: "consultants",
    desc: "Independent advisors who bill on milestones or monthly retainers and need polished follow-up that matches their brand.",
    accent: "from-purple-500/20 to-indigo-500/10",
    border: "border-purple-500/20",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <SiteHeader />

      <main id="main-content" className="flex-1">

        {/* ── Hero ── */}
        <section className="relative border-b border-white/5 py-28 sm:py-36 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,70,229,0.28), transparent)",
            }}
          />
          <Container className="max-w-4xl text-center">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
              Our story
            </p>
            <h1 className="text-pretty text-5xl font-bold tracking-[-0.04em] text-zinc-50 sm:text-6xl lg:text-7xl leading-[1.05]">
              Built because chasing{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                invoices is broken
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-400">
              Duely started with a simple frustration — sending invoices is easy,
              getting paid is an unpaid part-time job. We built the tool we
              wished existed.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 hover:shadow-indigo-500/40"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-7 py-3.5 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white"
              >
                See all features
              </Link>
            </div>
          </Container>
        </section>

        {/* ── Origin story ── */}
        <section className="border-b border-white/5 py-20 sm:py-28">
          <Container className="max-w-5xl">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-4">
                  Why we exist
                </p>
                <h2 className="text-3xl font-bold tracking-[-0.03em] text-zinc-50 sm:text-4xl leading-snug">
                  The gap between sending an invoice and actually getting paid
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-400">
                  <p>
                    Most invoicing tools stop the moment the invoice is sent.
                    But that&apos;s not when the work ends — it&apos;s when the
                    awkward part begins. Chasing clients over email, trying to
                    remember who promised what, logging things in spreadsheets
                    that go stale.
                  </p>
                  <p>
                    Duely sits in the gap. It&apos;s not an invoicing tool and
                    it&apos;s not a CRM. It&apos;s a dedicated accounts
                    receivable workspace for small service businesses — designed
                    around the workflow of actually collecting money, not just
                    recording it.
                  </p>
                  <p>
                    We connect to the tools you already use (Xero, QuickBooks,
                    Stripe, Gmail), pull in what you&apos;re owed, and give you
                    a clear, prioritised system to work through it every day.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-8 sm:p-10 space-y-8">
                {[
                  {
                    stat: "47%",
                    label: "of invoices sent by freelancers are paid late",
                  },
                  {
                    stat: "3–4 hrs",
                    label: "per week spent on manual follow-up by the average consultant",
                  },
                  {
                    stat: "1 in 5",
                    label: "small business invoices are never paid at all",
                  },
                ].map(({ stat, label }) => (
                  <div key={stat} className="flex items-start gap-5">
                    <div className="text-3xl font-bold text-indigo-400 tabular-nums shrink-0 min-w-[4rem]">
                      {stat}
                    </div>
                    <p className="text-base leading-relaxed text-zinc-400 pt-1">
                      {label}
                    </p>
                  </div>
                ))}
                <p className="text-xs text-zinc-600 pt-2 border-t border-white/5">
                  Sources: Xero Small Business Insights, FreshBooks State of Self-Employment
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* ── Values ── */}
        <section className="border-b border-white/5 py-20 sm:py-28">
          <Container className="max-w-5xl">
            <div className="mb-14 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-4">
                What we believe
              </p>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                Principles that shape every decision
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {values.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/[0.04]"
                >
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 transition-colors group-hover:border-indigo-500/40 group-hover:bg-indigo-500/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-zinc-100">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-500">{body}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── Who it's for ── */}
        <section className="border-b border-white/5 py-20 sm:py-28">
          <Container className="max-w-5xl">
            <div className="mb-14 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-4">
                Who it&apos;s for
              </p>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                Made for the people doing the work
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
                Not for enterprise finance teams. For the people who send the
                invoice, do the work, and then have to chase the payment
                themselves.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {audiences.map(({ label, slug, desc, accent, border }) => (
                <div
                  key={label}
                  className={`relative overflow-hidden rounded-2xl border ${border} bg-gradient-to-br ${accent} p-8`}
                >
                  <div
                    aria-hidden
                    className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5 blur-2xl"
                  />
                  <h3 className="mb-3 text-xl font-bold text-zinc-50">
                    {label}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{desc}</p>
                  <Link
                    href={`/for-${slug}`}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
                  >
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 sm:py-32 relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(79,70,229,0.22), transparent)",
            }}
          />
          <Container className="max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
              Stop losing money to late payments
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">
              Join the independent professionals using Duely to get paid faster,
              with less awkwardness and zero spreadsheets.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 hover:shadow-indigo-500/40"
              >
                Try Duely free for 7 days
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-7 py-3.5 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-5 text-sm text-zinc-600">
              No credit card required &middot; Cancel any time
            </p>
          </Container>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
