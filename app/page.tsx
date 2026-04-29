import Image from "next/image";
import Link from "next/link";

import { redirect } from "next/navigation";

import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";
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
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Nudge Logo"
              width={30}
              height={21}
              className="h-6 w-auto"
            />
            <span className="font-semibold tracking-tight text-zinc-50">Nudge</span>
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
                Get paid without turning every invoice into a conversation.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
                Nudge sends calm, professional reminder emails for money owed.
                Create a nudge once, track what is active, and mark it resolved
                when payment lands.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup">
                  <Button size="lg">Start free trial</Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="lg">
                    View dashboard
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-zinc-500">
                Then {monthlyPrice.inline}. Cancel anytime. Unsubscribe links are included automatically.
              </p>

              <div className="mt-12 grid max-w-xl gap-4 sm:grid-cols-3">
                {[
                  ["1 min", "to create"],
                  ["24h+", "send spacing"],
                  ["0", "awkward pings"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-border bg-white/[0.03] p-4"
                  >
                    <div className="text-2xl font-semibold tracking-tight text-zinc-50">
                      {value}
                    </div>
                    <div className="mt-1 text-sm text-zinc-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden bg-white/[0.035]">
              <CardContent className="p-0">
                <div className="border-b border-border px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-zinc-100">
                        Active nudges
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        Quietly running in the background
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
                      3 sending
                    </span>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="rounded-2xl border border-white/10 bg-background/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-zinc-50">Sam Carter</div>
                        <div className="mt-1 text-sm text-zinc-500">
                          sam@example.com
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-zinc-50">$420.00</div>
                        <div className="mt-1 text-xs text-zinc-500">due</div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-400">
                      Next reminder queued for Thursday at 9:00 AM.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-background/70 p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-600">
                      Timeline
                    </div>
                    <div className="mt-4 space-y-4">
                      <div className="flex gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                        <div>
                          <p className="text-sm text-zinc-200">
                            Reminder sent to Riley
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Yesterday at 9:04 AM
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-zinc-600" />
                        <div>
                          <p className="text-sm text-zinc-200">
                            Payment marked resolved
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Monday at 2:18 PM
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>

        <Container className="pb-20">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [
                "Create",
                "Add a recipient, amount, and cadence without thinking about accounting software.",
              ],
              [
                "Track",
                "See exactly which nudges are active, paused, queued, or recently sent.",
              ],
              [
                "Resolve",
                "Stop the loop as soon as the balance is paid. No extra workflow required.",
              ],
            ].map(([title, copy]) => (
              <Card key={title} className="bg-white/[0.025]">
                <CardContent className="p-6">
                  <div className="text-sm font-semibold text-zinc-50">{title}</div>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">{copy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </main>

      <footer className="border-t border-border">
        <Container className="py-8 text-sm text-zinc-600">
          © {new Date().getFullYear()} Nudge
        </Container>
      </footer>
    </div>
  );
}
