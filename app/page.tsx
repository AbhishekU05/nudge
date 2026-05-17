import Image from "next/image";
import Link from "next/link";

import { redirect } from "next/navigation";

import { AuthErrorRedirect } from "@/components/site/auth-error-redirect";
import { Container } from "@/components/site/container";
import { HeroEmailCapture } from "@/components/site/hero-email-capture";
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
    <div className="flex flex-1 flex-col">
      <AuthErrorRedirect />
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              width={32}
              height={32}
              alt="Duely Logo"
              className="h-8 w-8 rounded-md"
            />
            <span className="text-2xl font-semibold tracking-tight text-zinc-50">Duely</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/faq"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-200 sm:inline-flex"
            >
              FAQ
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="relative py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(79,70,229,0.24),transparent_28rem),radial-gradient(circle_at_80%_8%,rgba(168,85,247,0.14),transparent_22rem)]" />
          {/* HERO */}
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(28rem,1fr)] lg:items-center">
            <div className="max-w-3xl">
              <Badge variant="default" className="gap-1.5">
                <Sparkles className="h-3 w-3" />
                Receivables command center
              </Badge>
              <h1 className="mt-7 text-pretty text-5xl font-semibold tracking-[-0.045em] text-zinc-50 sm:text-6xl lg:text-7xl">
                Collect what you&apos;re owed without making every follow-up awkward.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
                Duely gives freelancers and service teams a focused workspace
                for balances, promises, partial payments, and respectful
                reminders.
              </p>
              <HeroEmailCapture />
              <div className="mt-6 grid max-w-2xl gap-2 text-sm text-zinc-500 sm:grid-cols-3">
                {[
                  "Partial payment history",
                  "Customer vs user paid labels",
                  "Editable reminder templates",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 top-10 hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 shadow-2xl shadow-emerald-950/30 lg:block">
                $1,280 collected today
              </div>
              <Card className="overflow-hidden border-white/10 bg-white/[0.03] p-2 shadow-2xl shadow-black/40">
                <CardContent className="relative p-0">
                  <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                        Pipeline
                      </p>
                      <p className="mt-1 text-sm font-semibold text-zinc-100">
                        14 active customers
                      </p>
                    </div>
                    <Badge variant="warning">3 need attention</Badge>
                  </div>
                  <Image
                    src="/dashboard-preview.png"
                    width={1200}
                    height={720}
                    alt="Duely collections dashboard overview"
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="h-auto w-full rounded-xl opacity-90"
                    priority
                  />
                </CardContent>
              </Card>
              <div className="absolute -bottom-6 right-4 hidden w-64 rounded-2xl border border-white/10 bg-card/95 p-4 shadow-2xl shadow-black/45 backdrop-blur sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-200">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">
                      Follow-up drafted
                    </p>
                    <p className="text-xs text-zinc-600">
                      Professional tone, editable before sending
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>

        {/* WORKFLOW OVERVIEW */}
        <div className="border-y border-white/5 bg-white/[0.01]">
          <Container className="py-12">
            <h3 className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-zinc-500">
              The Post-Invoice Pipeline
            </h3>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6 text-sm">
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-red-200">
                <AlertTriangle className="h-4 w-4" /> Overdue
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-700 rotate-90 sm:rotate-0" />
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-zinc-300">
                <Clock className="h-4 w-4 text-amber-400" /> Promised
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-700 rotate-90 sm:rotate-0" />
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-zinc-300">
                <div className="flex h-4 w-4 items-center justify-center rounded-full border border-emerald-500/50">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                Partial
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-700 rotate-90 sm:rotate-0" />
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Paid
              </div>
            </div>
          </Container>
        </div>

        {/* WORKFLOW SECTIONS */}
        <Container className="py-24 sm:py-32 space-y-24 sm:space-y-32">
          
          {/* 1. Track what clients owe */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 relative">
              <Card className="overflow-hidden bg-white/[0.025] p-2">
                <CardContent className="p-0">
                  <Image
                    src="/partial-payment.png"
                    width={800}
                    height={500}
                    alt="Partial payment tracking feature"
                    sizes="(max-width: 1024px) 100vw, 600px"
                    className="h-auto w-full rounded-xl"
                  />
                </CardContent>
              </Card>
            </div>
            <div className="order-1 lg:order-2 max-w-xl lg:pl-10">
              <h2 className="text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Know exactly what&apos;s outstanding.
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-400">
                Get a clear view of your receivables. Track full balances, log partial payments installments, and monitor due dates all in one organized place. Stop guessing who owes what.
              </p>
            </div>
          </div>

          {/* 2. Keep track of promises & notes */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="max-w-xl lg:pr-10">
              <h2 className="text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Never forget a promise or detail.
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-400">
                When a client says they&apos;ll pay next Friday, log it. Attach internal notes to their profile so you remember previous conversations. Duely acts as your operational memory.
              </p>
            </div>
            <div className="relative">
              <Card className="overflow-hidden bg-white/[0.025] p-2">
                <CardContent className="p-0">
                  <Image
                    src="/promise-notes.png"
                    width={800}
                    height={500}
                    alt="Tracking promises and notes"
                    sizes="(max-width: 1024px) 100vw, 600px"
                    className="h-auto w-full rounded-xl"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 3. Follow up professionally */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 relative">
              <Card className="overflow-hidden bg-white/[0.025] p-2">
                <CardContent className="p-0">
                  <Image
                    src="/follow-up.png"
                    width={800}
                    height={500}
                    alt="Message drafter and follow-up tools"
                    sizes="(max-width: 1024px) 100vw, 600px"
                    className="h-auto w-full rounded-xl"
                  />
                </CardContent>
              </Card>
            </div>
            <div className="order-1 lg:order-2 max-w-xl lg:pl-10">
              <h2 className="text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Follow up with confidence.
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-400">
                Draft the perfect message instantly. Select the right tone—friendly, professional, or firm—and let Duely generate a contextual follow-up based on their specific balance and delay.
              </p>
            </div>
          </div>

          {/* 4. Automate as backup */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="max-w-xl lg:pr-10">
              <h2 className="text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Automate as a backup escalation.
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-400">
                For clients who need a persistent push, set up an automated email sequence. It runs quietly in the background as a supporting workflow and stops instantly when you record a payment.
              </p>
            </div>
            <div className="relative">
              <Card className="overflow-hidden bg-white/[0.025] p-2">
                <CardContent className="p-0 relative group">
                  <Image
                    src="/email-reminder-preview.png"
                    width={720}
                    height={540}
                    alt="Dark-mode email preview showing a Duely payment reminder"
                    sizes="(max-width: 1024px) 100vw, 600px"
                    className="h-auto w-full rounded-xl"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center sm:px-12 sm:py-20 lg:px-16">
            <h2 className="mx-auto max-w-2xl text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
              Ready to organize your receivables?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              Bring operational clarity to your post-invoice workflow. Stop chasing clients out of your inbox and start collecting payments professionally.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg">Start tracking payments</Button>
              </Link>
            </div>
          </div>

        </Container>
      </main>

      <footer className="border-t border-border">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 text-sm text-zinc-600">
          <div>© {new Date().getFullYear()} Duely. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="hover:text-zinc-300 transition-colors">FAQ</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <span>Contact us:</span>
              <a href="mailto:support@duely.in" className="font-medium text-zinc-400 hover:text-zinc-100 transition-colors">
                support@duely.in
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
