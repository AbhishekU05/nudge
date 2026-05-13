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
              <div className="mt-10 flex max-w-xl flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">
                <span>Sent automatically</span>
                <span>Professionally spaced</span>
                <span>No awkward client follow-ups</span>
              </div>
            </div>

            <div className="relative">
              <p className="mb-3 ml-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
                Real reminder email
              </p>
              <Card className="overflow-hidden bg-white/[0.025] p-2">
                <CardContent className="p-0">
                  <Image
                    src="/email-reminder-preview.png"
                    width={720}
                    height={540}
                    alt="Dark-mode email preview showing a Duely payment reminder"
                    priority
                    sizes="(max-width: 1024px) 100vw, 38vw"
                    className="h-auto w-full rounded-xl"
                  />
                </CardContent>
              </Card>
              <div className="mt-4 flex flex-wrap justify-between gap-3 px-1 text-xs text-zinc-600">
                <span>Quietly runs in the background</span>
                <span>Stops when paid</span>
              </div>
            </div>
          </div>
        </Container>

        <Container className="pb-24 sm:pb-28">
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-zinc-400">
                Track every reminder
              </p>
              <h2 className="mt-3 text-pretty text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                Know what’s still outstanding without chasing the client yourself.
              </h2>
            </div>
            <div className="flex max-w-md flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500 lg:justify-end">
              <span>Stops when paid</span>
              <span>Designed for agencies and freelancers</span>
              <span>Professionally spaced</span>
            </div>
          </div>

          <Card className="overflow-hidden bg-white/[0.025] p-2">
            <CardContent className="p-0">
              <Image
                src="/dashboard-preview.svg"
                width={1200}
                height={720}
                alt="Duely dashboard preview showing active reminders, quick create, and reminder activity"
                sizes="(max-width: 768px) 100vw, 1120px"
                className="h-auto w-full rounded-xl"
              />
            </CardContent>
          </Card>

          <div className="mt-4 flex flex-wrap gap-x-7 gap-y-2 px-1 text-xs text-zinc-600 sm:px-2">
            <span>Sent automatically</span>
            <span>Track every reminder</span>
            <span>No awkward client follow-ups</span>
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
