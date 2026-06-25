import Link from "next/link";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { joinWaitlist } from "@/app/actions/billing";

export default function WaitlistPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href="/settings/billing"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to billing
      </Link>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/30 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(79,70,229,0.22),transparent_28rem),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.12),transparent_20rem)]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
          <div>
            <Badge variant="warning" className="gap-1.5">
              <Clock className="h-3 w-3" />
              Payments coming soon
            </Badge>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.055em] text-zinc-50 sm:text-5xl">
              We are switching our payment provider.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-500">
              We're currently transitioning our billing system to Dodo Payments.
              In the meantime, you can join our waitlist!
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
              Special Offer
            </p>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              1 Month Free
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Join the waitlist today and receive a complementary one-month extended trial on us!
            </p>
            <div className="mt-5">
              <form action={joinWaitlist}>
                <Button type="submit" className="w-full">
                  Join the waitlist
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
