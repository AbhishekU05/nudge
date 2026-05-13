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
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(25rem,0.82fr)] lg:items-center">
            <div className="max-w-3xl">
              <Badge variant="default">Automated payment follow-ups</Badge>
              <h1 className="mt-7 text-pretty text-5xl font-semibold tracking-[-0.045em] text-zinc-50 sm:text-6xl lg:text-7xl">
                Clients forget invoices. Duely doesn’t.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
                Professional invoice follow-ups sent automatically until you get paid.
              </p>
            </div>

            <Card className="overflow-hidden bg-white/[0.035]">
              <CardContent className="p-0">
                <div className="border-b border-border px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-zinc-100">
                        Automated reminder email
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        Prepared from your invoice details
                      </div>
                    </div>
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs text-primary-foreground">
                      Queued
                    </span>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="rounded-2xl border border-white/10 bg-background/70 p-5">
                    <div className="space-y-3 border-b border-white/10 pb-4">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
                          To
                        </div>
                        <div className="mt-1 text-sm text-zinc-200">
                          Morgan Lee &lt;morgan@northstar.co&gt;
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
                          Subject
                        </div>
                        <div className="mt-1 text-sm font-medium text-zinc-50">
                          Reminder: Invoice INV-1048 from Avery Studio
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-5 text-sm leading-6 text-zinc-300">
                      <p>Hi Morgan,</p>
                      <p>
                        I hope you’re well. This is a quick reminder that invoice
                        INV-1048 for the March brand refresh is still awaiting
                        payment.
                      </p>
                      <p>
                        When you have a moment, you can complete payment using the
                        original invoice link. Please let me know if anything needs
                        updating.
                      </p>
                      <p>
                        Best,
                        <br />
                        Avery Studio
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <div className="text-xs text-zinc-500">Automation</div>
                      <div className="mt-1 text-sm font-medium text-zinc-100">
                        Next reminder in 5 days
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <div className="text-xs text-zinc-500">Automation</div>
                      <div className="mt-1 text-sm font-medium text-zinc-100">
                        Stops automatically when paid
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
