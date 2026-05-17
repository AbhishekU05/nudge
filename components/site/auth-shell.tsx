import type { ReactNode } from "react";

import Image from "next/image";

import Link from "next/link";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";

import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex flex-1 items-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(79,70,229,0.20),transparent_26rem),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.12),transparent_22rem)]" />
      <Container className="py-10 sm:py-16">
        <div className="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.82fr)] lg:items-center">
          <div className="hidden lg:block">
            <Link href="/" className="mb-10 inline-flex items-center gap-3">
              <Image
                src="/logo.svg"
                width={32}
                height={32}
                alt="Duely Logo"
                className="h-8 w-8 rounded-md"
              />
              <span className="text-2xl font-semibold tracking-tight text-zinc-50">
                Duely
              </span>
            </Link>
            <p className="max-w-xl text-5xl font-semibold tracking-[-0.055em] text-zinc-50">
              Receivables without the awkward chase.
            </p>
            <p className="mt-5 max-w-lg text-base leading-7 text-zinc-500">
              Track balances, log partial payments, and escalate with polished
              reminders only when a customer needs the nudge.
            </p>

            <div className="mt-9 grid max-w-xl gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
                      Today
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">
                      8 open balances
                    </p>
                  </div>
                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-100">
                    3 overdue
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-400" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <p className="mt-3 text-xs leading-5 text-zinc-400">
                    Verified payment status
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <Clock className="h-4 w-4 text-amber-300" />
                  <p className="mt-3 text-xs leading-5 text-zinc-400">
                    Promises and due dates
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <ShieldCheck className="h-4 w-4 text-indigo-300" />
                  <p className="mt-3 text-xs leading-5 text-zinc-400">
                    Respectful reminders
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center justify-center lg:hidden">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.svg"
                  width={32}
                  height={32}
                  alt="Duely Logo"
                  className="h-8 w-8 rounded-md"
                />
                <span className="text-2xl font-semibold tracking-tight text-zinc-50">
                  Duely
                </span>
              </Link>
            </div>
            <Card className="border-white/10 bg-card/90 shadow-2xl shadow-black/35 backdrop-blur">
              <CardHeader className="p-7 pb-3">
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="p-7 pt-4">{children}</CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
