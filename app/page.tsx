import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthErrorRedirect } from "@/components/site/auth-error-redirect";
import { Container } from "@/components/site/container";
import { FadeIn, Reveal, SlideUp, SlideIn } from "@/components/site/scroll-animation";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <AuthErrorRedirect />
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <Image
              src="/logo.svg"
              width={32}
              height={32}
              alt="Duely Logo"
              className="h-8 w-8 rounded-md shadow-sm"
            />
            <span className="text-xl font-semibold tracking-tight text-zinc-50">Duely</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100 sm:inline-flex"
            >
              About
            </Link>
            <Link
              href="/articles"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100 sm:inline-flex"
            >
              Articles
            </Link>
            <Link
              href="/faq"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100 sm:inline-flex"
            >
              FAQ
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-zinc-50">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="shadow-lg shadow-indigo-500/20">Get started</Button>
            </Link>
          </div>
        </Container>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-32 lg:pb-40">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(79,70,229,0.15),transparent_60%),radial-gradient(ellipse_at_80%_40%,rgba(168,85,247,0.08),transparent_50%)]" />
          
          <Container>
            <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <FadeIn className="max-w-2xl">
                <Badge variant="default" className="gap-1.5 border-indigo-500/30 bg-indigo-500/10 text-indigo-300 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  The receivables workspace
                </Badge>
                <h1 className="mt-8 text-pretty text-5xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-6xl lg:text-[4.5rem] lg:leading-[1.05]">
                  Getting paid is the easy part. <span className="text-zinc-400">Getting clients to pay isn&apos;t.</span>
                </h1>
                <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400">
                  Duely is the missing layer between your invoice and your bank account.
                </p>
                <p className="mt-4 max-w-xl text-pretty text-base font-medium text-zinc-300">
                  Works with any invoicing tool. Or none at all. Add your first client in 30 seconds.
                </p>
                <div className="mt-10">
                  <Link href="/signup">
                    <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-indigo-500/20 w-full sm:w-auto">
                      Start free trial — no card required
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </FadeIn>

              <Reveal delay={0.2} className="relative z-10 lg:ml-auto w-full max-w-[800px] lg:max-w-none">
                <Card className="relative z-20 overflow-hidden border-white/10 bg-zinc-900/50 p-2 shadow-2xl shadow-black/60 backdrop-blur-sm max-w-full">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 opacity-50" />
                  <CardContent className="relative p-0 rounded-xl overflow-hidden border border-white/5 bg-zinc-950">
                    <Image
                      src="/dashboard-preview.png"
                      width={1200}
                      height={720}
                      alt="Duely collections dashboard overview"
                      sizes="(max-width: 1024px) 100vw, 800px"
                      className="h-auto w-full max-w-full object-cover opacity-90 transition-transform duration-700 hover:scale-[1.02]"
                      priority
                    />
                  </CardContent>
                </Card>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* WORKFLOW SECTIONS */}
        <section className="relative overflow-hidden py-24 sm:py-32 space-y-32 sm:space-y-40 bg-zinc-950/50 border-y border-white/5 backdrop-blur-sm">
          
          {/* Section 1: Promise Logging */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <SlideIn left>
                <div className="relative order-2 lg:order-1">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-2 shadow-xl shadow-black/20">
                    <CardContent className="p-0 rounded-xl border border-white/5 bg-zinc-950 overflow-hidden">
                      <Image
                        src="/promise-notes.png"
                        width={800}
                        height={500}
                        alt="Tracking promises and notes"
                        sizes="(max-width: 1024px) 100vw, 600px"
                        className="h-auto w-full object-cover"
                      />
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
              <FadeIn delay={0.2} className="order-1 lg:order-2 max-w-xl lg:pl-12 xl:pl-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 mb-6">
                  <ShieldCheck className="h-6 w-6 text-amber-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  David said he&apos;d pay Friday. It&apos;s Monday.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  You remember the conversation. You just don&apos;t remember exactly what he said, when he promised, or how many times you&apos;ve followed up. Duely logs every promise, every partial payment, every note — so you always know where you stand before you reach out.
                </p>
              </FadeIn>
            </div>
          </Container>

          {/* Section 2: Message templates */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12 xl:pr-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 mb-6">
                  <MessageSquare className="h-6 w-6 text-purple-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  The follow-up you&apos;ve been putting off.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Too friendly and they ignore it. Too firm and you damage the relationship. Duely gives you message templates for every situation — friendly nudge, professional reminder, firm notice — so you always say the right thing.
                </p>
              </FadeIn>
              <SlideIn right delay={0.2} className="flex justify-center">
                <div className="relative w-full max-w-[26rem]">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-2 shadow-xl shadow-black/20">
                    <CardContent className="p-0 rounded-xl border border-white/5 bg-zinc-950 overflow-hidden">
                      <Image
                        src="/follow-up.png"
                        width={800}
                        height={500}
                        alt="Message drafter and follow-up tools"
                        sizes="(max-width: 1024px) 100vw, 400px"
                        className="h-auto w-full object-cover"
                      />
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
            </div>
          </Container>

          {/* Section 3: Outstanding Payments */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <SlideIn left>
                <div className="relative order-2 lg:order-1">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.08),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-2 shadow-xl shadow-black/20">
                    <CardContent className="p-0 rounded-xl border border-white/5 bg-zinc-950 overflow-hidden">
                      <div className="flex h-[350px] sm:h-[450px] w-full items-center justify-center bg-zinc-900 border border-white/5 text-sm font-medium text-zinc-500 text-center px-4">
                        [SCREENSHOT: client list with balances]
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
                  All your outstanding payments. One place.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Not your head. Not a spreadsheet. Not three different email threads. Every client, every balance, every due date — tracked and visible so nothing falls through the cracks.
                </p>
              </FadeIn>
            </div>
          </Container>

          {/* Section 4: Automate */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12 xl:pr-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 mb-6">
                  <Zap className="h-6 w-6 text-emerald-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  When all else fails, automate it.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  If a client has gone quiet, Duely can send an automated reminder with a payment link attached. Set it and forget it — Duely follows up so you don&apos;t have to.
                </p>
              </FadeIn>
              <SlideIn right delay={0.2} className="flex justify-center">
                <div className="relative w-full max-w-[22rem]">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-2 shadow-xl shadow-black/20">
                    <CardContent className="p-0 rounded-xl border border-white/5 bg-zinc-950 overflow-hidden relative group">
                      <Image
                        src="/email-reminder-preview.png"
                        width={720}
                        height={540}
                        alt="Dark-mode email preview showing a Duely payment reminder"
                        sizes="(max-width: 1024px) 100vw, 400px"
                        className="h-auto w-full object-cover"
                      />
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
            </div>
          </Container>
        </section>

        {/* SOCIAL PROOF */}
        <section className="py-24 border-b border-white/5 bg-zinc-950/30">
          <Container>
            <div className="mx-auto max-w-4xl flex h-40 items-center justify-center rounded-2xl bg-zinc-800/50 border border-white/10 text-sm font-medium text-zinc-500 text-center px-4">
              [SOCIAL PROOF: add a customer quote or stat here before launch]
            </div>
          </Container>
        </section>

        {/* WORKS WITH */}
        <section className="py-16 border-b border-white/5 bg-zinc-950 text-center">
          <Container>
            <FadeIn>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-6">Works with</h3>
              <div className="flex justify-center items-center gap-4 text-zinc-400">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-medium">Stripe <span className="text-zinc-500 font-normal">(Beta — connect your Stripe account to auto-sync invoices)</span></span>
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
                      $10
                      <span className="ml-1 text-base font-normal text-zinc-500">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="mt-8 space-y-4 text-sm text-zinc-300">
                      {[
                        "Unlimited clients",
                        "Promise logging and notes",
                        "Message templates",
                        "Automated reminders with payment link",
                        "Stripe sync (Beta)"
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

        {/* FOUNDER NOTE */}
        <section className="py-24 sm:py-32 border-t border-white/5 bg-zinc-950/50">
          <Container>
            <FadeIn>
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] mb-8">
                  <User className="h-8 w-8 text-zinc-400" />
                </div>
                <blockquote className="text-lg leading-relaxed text-zinc-400">
                  &quot;I built Duely because I watched people lose thousands to payment awkwardness — not bad clients, just no system. I&apos;m building this seriously and in public.<br /><br />
                  If you have feedback — <a href="mailto:abhishek@duely.in" className="text-indigo-400 hover:text-indigo-300 transition-colors">abhishek@duely.in</a><br />
                  — Abhishek&quot;
                </blockquote>
              </div>
            </FadeIn>
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
                    a: "Automated reminders are sent from Duely on your behalf. You control the timing and tone before anything goes out."
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
                
                <div className="mt-10">
                  <Link href="/signup">
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

      <footer className="border-t border-white/5 bg-zinc-950">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-6 py-10 text-sm text-zinc-500">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              width={20}
              height={20}
              alt="Duely Logo"
              className="h-5 w-5 rounded-sm opacity-50 grayscale"
            />
            <span>© {new Date().getFullYear()} Duely. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
            <Link href="/about" className="hover:text-zinc-300 transition-colors">About</Link>
            <Link href="/articles" className="hover:text-zinc-300 transition-colors">Articles</Link>
            <Link href="/faq" className="hover:text-zinc-300 transition-colors">FAQ</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="hidden sm:inline">Contact us:</span>
              <a href="mailto:abhishek@duely.in" className="font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
                abhishek@duely.in
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
