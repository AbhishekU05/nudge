import Link from "next/link";

import { redirect } from "next/navigation";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLocalizedMonthlyPrice } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const monthlyPrice = await getLocalizedMonthlyPrice();

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
                Chase payments on autopilot. Skip the awkward follow-ups.
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-zinc-600">
                Set up gentle, automated payment reminders that run perfectly on your
                schedule. Get paid faster without souring client relationships.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup">
                  <Button>Start free trial, then {monthlyPrice.inline}</Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost">View your dashboard</Button>
                </Link>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Cancel anytime. Unsubscribe links included automatically.
              </p>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="border-b border-zinc-200 bg-white px-5 py-4">
                  <div className="text-sm font-medium text-zinc-900">
                    Sample follow-up email
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Sent automatically on your preferred schedule
                  </div>
                </div>
                <div className="space-y-3 bg-zinc-50 px-5 py-4 text-sm text-zinc-700">
                  <p className="font-medium text-zinc-900">Subject: Following up on your pending balance</p>
                  <p>Hi Sam,</p>
                  <p>
                    Just floating this to the top of your inbox. This is a gentle automated reminder that your balance of $42.00 is still outstanding.
                  </p>
                  <p>
                    If you've recently made a payment, please disregard this note!
                  </p>
                  <p className="text-zinc-600">
                    Best regards,<br />Abhi
                  </p>
                  <p className="pt-2 text-xs text-zinc-500">
                    Don't want these reminders? <span className="underline">Unsubscribe here</span>.
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
