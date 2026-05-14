import Image from "next/image";
import Link from "next/link";

import { redirect } from "next/navigation";

import { AuthErrorRedirect } from "@/components/site/auth-error-redirect";
import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getEmailLinkErrorMessage } from "@/lib/auth-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  Clock,
  ArrowRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
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
        <Container className="py-16 sm:py-24">
          {/* HERO */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="max-w-3xl">
              <Badge variant="default">Client payment management</Badge>
              <h1 className="mt-7 text-pretty text-5xl font-semibold tracking-[-0.045em] text-zinc-50 sm:text-6xl lg:text-7xl">
                Collect what you're owed, keep the relationship.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
                A lightweight collections workflow for service businesses. Track unpaid work, log partial payments, and follow up professionally without the mental overhead.
              </p>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">
                <span>No accounting bloat</span>
                <span>Organize follow-ups</span>
                <span>Manage promises</span>
              </div>
            </div>

            <div className="relative">
              <p className="mb-3 ml-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
                Operational Overview
              </p>
              <Card className="overflow-hidden bg-white/[0.025] p-2">
                <CardContent className="p-0">
                  <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-sm text-zinc-500">
                    [Pipeline Dashboard Screenshot]
                  </div>
                </CardContent>
              </Card>
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
              <Card className="overflow-hidden bg-white/[0.025] p-6 flex flex-col justify-center gap-6 aspect-[16/9] border-dashed">
                <div className="w-full max-w-sm mx-auto rounded-xl border border-white/10 bg-background/50 p-5 shadow-2xl">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Paid: <span className="font-semibold text-zinc-100">$2,500</span></span>
                    <span className="text-zinc-400">Remaining: <span className="font-semibold text-zinc-100">$2,500</span></span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full bg-emerald-500 w-1/2" />
                  </div>
                  <p className="mt-2 text-right text-xs text-zinc-500">50% collected of $5,000</p>
                </div>
                <div className="text-center text-xs text-zinc-600 uppercase tracking-widest">[Partial Payment UI Preview]</div>
              </Card>
            </div>
            <div className="order-1 lg:order-2 max-w-xl lg:pl-10">
              <h2 className="text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Know exactly what's outstanding.
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
                When a client says they'll pay next Friday, log it. Attach internal notes to their profile so you remember previous conversations. Duely acts as your operational memory.
              </p>
            </div>
            <div className="relative">
              <Card className="overflow-hidden bg-white/[0.025] p-6 flex flex-col justify-center gap-4 aspect-[16/9] border-dashed items-center">
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-200 shadow-xl">
                    <Clock className="h-4 w-4 text-amber-400" /> Promised Friday
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-200 shadow-xl">
                    <FileText className="h-4 w-4 text-indigo-400" /> Internal Notes
                  </div>
                </div>
                <div className="mt-4 text-center text-xs text-zinc-600 uppercase tracking-widest">[Client Detail UI Preview]</div>
              </Card>
            </div>
          </div>

          {/* 3. Follow up professionally */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 relative">
              <Card className="overflow-hidden bg-white/[0.025] p-2">
                <CardContent className="p-0">
                  <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-sm text-zinc-500">
                    [Message Drafter Screenshot]
                  </div>
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
                  <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-sm text-zinc-500">
                    [Email Template Preview Screenshot]
                  </div>
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
