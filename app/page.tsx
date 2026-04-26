import Link from "next/link";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <Container className="flex h-14 items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight text-zinc-900">
            Nudge
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="secondary" size="sm">
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
        <Container className="py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-pretty text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
                Recurring reminder emails, without the awkward follow-ups.
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-zinc-600">
                Create a gentle, transactional reminder that repeats on your
                schedule. Recipients can unsubscribe anytime.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup">
                  <Button>Start for $1/month</Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost">View dashboard</Button>
                </Link>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Minimal. Trustworthy. No marketing fluff.
              </p>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="border-b border-zinc-200 bg-white px-5 py-4">
                  <div className="text-sm font-medium text-zinc-900">
                    Example email
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Plain text + HTML, transactional tone
                  </div>
                </div>
                <div className="space-y-3 bg-zinc-50 px-5 py-4 text-sm text-zinc-700">
                  <p className="font-medium text-zinc-900">Subject: Reminder</p>
                  <p>Hi Sam,</p>
                  <p>
                    This is a friendly reminder that $42.00 is still owed.
                  </p>
                  <p>
                    If you’ve already paid, you can ignore this message.
                  </p>
                  <p className="text-zinc-600">
                    — Abhi
                  </p>
                  <p className="pt-2 text-xs text-zinc-500">
                    Unsubscribe link included at the bottom.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <Container className="py-8 text-sm text-zinc-500">
          © {new Date().getFullYear()} Nudge
        </Container>
      </footer>
    </div>
  );
}
