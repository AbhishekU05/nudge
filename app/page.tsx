import Image from "next/image";
import Link from "next/link";

import { redirect } from "next/navigation";

import { AuthErrorRedirect } from "@/components/site/auth-error-redirect";
import { Container } from "@/components/site/container";
import { HeroEmailCapture } from "@/components/site/hero-email-capture";
import { FadeIn, Reveal, SlideUp, SlideIn } from "@/components/site/scroll-animation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getEmailLinkErrorMessage } from "@/lib/auth-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Zap,
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
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(79,70,229,0.15),transparent_60%),radial-gradient(ellipse_at_80%_40%,rgba(168,85,247,0.08),transparent_50%)]" />
          
          <Container>
            <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <FadeIn className="max-w-2xl">
                <Badge variant="default" className="gap-1.5 border-indigo-500/30 bg-indigo-500/10 text-indigo-300 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  The receivables workspace
                </Badge>
                <h1 className="mt-8 text-pretty text-5xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-6xl lg:text-[4.5rem] lg:leading-[1.05]">
                  Collect what you&apos;re owed, <span className="text-zinc-400">keep the relationship.</span>
                </h1>
                <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400">
                  Duely gives freelancers and service teams a focused workspace
                  for balances, promises, partial payments, and respectful
                  reminders.
                </p>
                <HeroEmailCapture />
                <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500">
                  {[
                    "Track partial payments",
                    "Contextual templates",
                    "Automated escalations",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400/80" />
                      <span>{item}</span>
                    </div>
                  ))}
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

        {/* WORKFLOW OVERVIEW */}
        <section className="relative z-20 border-y border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <Container className="py-10">
            <FadeIn>
              <div className="mb-8 text-center">
                <h2 className="text-xl font-medium tracking-tight text-zinc-100 sm:text-2xl">
                  Every client moves through a clear workflow
                </h2>
                <p className="mt-3 text-sm text-zinc-400">
                  Track the exact status of your receivables from overdue to paid.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 md:gap-6 text-sm font-medium">
                <div className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-red-300 shadow-sm transition-colors hover:bg-red-500/15">
                  <AlertTriangle className="h-4 w-4" /> Overdue
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-700 rotate-90 sm:rotate-0 shrink-0" />
                <div className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-zinc-300 shadow-sm transition-colors hover:bg-white/[0.05]">
                  <Clock className="h-4 w-4 text-amber-400" /> Promised
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-700 rotate-90 sm:rotate-0 shrink-0" />
                <div className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-zinc-300 shadow-sm transition-colors hover:bg-white/[0.05]">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full border border-emerald-500/50">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  Partial
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-700 rotate-90 sm:rotate-0 shrink-0" />
                <div className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-emerald-300 shadow-sm transition-colors hover:bg-emerald-500/15">
                  <CheckCircle2 className="h-4 w-4" /> Paid
                </div>
              </div>
            </FadeIn>
          </Container>
        </section>

        {/* WORKFLOW SECTIONS */}
        <section className="relative overflow-hidden py-24 sm:py-32 space-y-32 sm:space-y-40">
          
          {/* Section 1: Track what clients owe */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <SlideIn left>
                <div className="relative order-2 lg:order-1">
                  <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.08),transparent_50%)]" />
                  <Card className="overflow-hidden border-white/10 bg-white/[0.02] p-2 shadow-xl shadow-black/20">
                    <CardContent className="p-0 rounded-xl border border-white/5 bg-zinc-950 overflow-hidden">
                      <Image
                        src="/partial-payment.png"
                        width={800}
                        height={500}
                        alt="Partial payment tracking feature"
                        sizes="(max-width: 1024px) 100vw, 600px"
                        className="h-auto w-full object-cover"
                      />
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
              <FadeIn delay={0.2} className="order-1 lg:order-2 max-w-xl lg:pl-12 xl:pl-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 mb-6">
                  <ShieldCheck className="h-6 w-6 text-indigo-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Know exactly what&apos;s outstanding.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Get a clear view of your receivables. Track full balances, log partial payments, and monitor due dates all in one organized place. Stop guessing who owes what.
                </p>
              </FadeIn>
            </div>
          </Container>

          {/* Section 2: Promises & Notes */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12 xl:pr-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 mb-6">
                  <Clock className="h-6 w-6 text-amber-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Never forget a promise or detail.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  When a client says they&apos;ll pay next Friday, log it. Attach internal notes to their profile so you remember previous conversations. Duely acts as your operational memory.
                </p>
              </FadeIn>
              <SlideIn right delay={0.2}>
                <div className="relative">
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
            </div>
          </Container>

          {/* Section 3: Follow up professionally */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1fr] lg:items-center">
              <SlideIn left className="flex justify-center order-2 lg:order-1">
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
              <FadeIn delay={0.2} className="order-1 lg:order-2 max-w-xl lg:pl-12 xl:pl-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 mb-6">
                  <MessageSquare className="h-6 w-6 text-purple-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Follow up with confidence.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Draft the perfect message instantly. Select the right tone—friendly, professional, or firm—and let Duely generate a contextual follow-up based on their specific balance and delay.
                </p>
              </FadeIn>
            </div>
          </Container>

          {/* Section 4: Automate as backup */}
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
              <FadeIn className="max-w-xl lg:pr-12 xl:pr-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 mb-6">
                  <Zap className="h-6 w-6 text-emerald-300" />
                </div>
                <h2 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-4xl">
                  Automate as a backup escalation.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  For clients who need a persistent push, set up an automated email sequence. It runs quietly in the background as a supporting workflow and stops instantly when you record a payment.
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

        {/* REDESIGNED CTA SECTION */}
        <section className="relative py-24 sm:py-32 overflow-hidden border-t border-white/5 bg-zinc-950">
          {/* Decorative background elements inside CTA */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-0 -ml-[40rem] h-[40rem] w-[80rem] rounded-full bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.15),transparent_60%)]" />
            <div className="absolute bottom-0 right-0 -mr-40 -mb-40 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.15),transparent_50%)]" />
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] mix-blend-overlay" />
          </div>

          <Container>
            <SlideUp>
              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h2 className="text-pretty text-4xl font-semibold tracking-[-0.03em] text-zinc-50 sm:text-5xl">
                  Ready to organize your receivables?
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                  Bring operational clarity to your post-invoice workflow. Stop chasing clients out of your inbox and start collecting payments professionally.
                </p>
                
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link href="/signup">
                    <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-indigo-500/20 w-full sm:w-auto">
                      Start collecting payments
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                <p className="mt-8 text-sm text-zinc-500">
                  14-day free trial. No credit card required.
                </p>
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
            <Link href="/faq" className="hover:text-zinc-300 transition-colors">FAQ</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="hidden sm:inline">Contact us:</span>
              <a href="mailto:support@duely.in" className="font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
                support@duely.in
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
