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
                Collect payments without the spreadsheet.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
                A lightweight collections workflow for agencies. Track what clients owe, manage promises, and organize follow-ups without the mental overhead.
              </p>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">
                <span>Track unpaid work</span>
                <span>Organize follow-ups</span>
                <span>Manage receivables</span>
              </div>
            </div>

            <div className="relative">
              <p className="mb-3 ml-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
                Operational Overview
              </p>
              <Card className="overflow-hidden bg-white/[0.025] p-2">
                <CardContent className="p-0">
                  <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-sm text-zinc-500">
                    [Collections Dashboard Placeholder]
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>

        {/* WORKFLOW SECTIONS */}
        <Container className="pb-24 sm:pb-32 space-y-24 sm:space-y-32">
          
          {/* 1. Track what clients owe */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 relative">
              <Card className="overflow-hidden bg-white/[0.025] p-2">
                <CardContent className="p-0">
                  <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-sm text-zinc-500">
                    [Client Tracking Screenshot Placeholder]
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="order-1 lg:order-2 max-w-xl lg:pl-10">
              <h2 className="text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Know exactly what's outstanding.
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-400">
                Get a clear view of your receivables. Track full balances, log partial payments, and monitor due dates all in one organized place.
              </p>
            </div>
          </div>

          {/* 2. Keep track of promises */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="max-w-xl lg:pr-10">
              <h2 className="text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Never forget a payment promise.
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-400">
                When a client says they'll pay next Friday, log it. Duely acts as your operational memory so verbal commitments and promised dates don't slip through the cracks.
              </p>
            </div>
            <div className="relative">
              <Card className="overflow-hidden bg-white/[0.025] p-2">
                <CardContent className="p-0">
                  <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-sm text-zinc-500">
                    [Promise Tracking Screenshot Placeholder]
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 3. Follow up professionally */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 relative">
              <Card className="overflow-hidden bg-white/[0.025] p-2">
                <CardContent className="p-0">
                  <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-sm text-zinc-500">
                    [Manual Follow-up Screenshot Placeholder]
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="order-1 lg:order-2 max-w-xl lg:pl-10">
              <h2 className="text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Follow up with confidence.
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-400">
                Keep a history of internal notes for context. Draft the perfect message using customizable templates, and choose the right tone—friendly, professional, or firm—for each follow-up.
              </p>
            </div>
          </div>

          {/* 4. Automate only when needed */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="max-w-xl lg:pr-10">
              <h2 className="text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Automate as a backup escalation.
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-400">
                For clients who need a persistent push, set up an automated email sequence. It runs quietly in the background as a supporting workflow and stops instantly when you mark them as paid.
              </p>
            </div>
            <div className="relative">
              <Card className="overflow-hidden bg-white/[0.025] p-2">
                <CardContent className="p-0">
                  <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-sm text-zinc-500">
                    [Automation Settings Screenshot Placeholder]
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
