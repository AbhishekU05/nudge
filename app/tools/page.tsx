import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, Clock, ShieldCheck } from "lucide-react";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  alternates: {
    canonical: "/tools",
  },
  description:
    "Free Duely tools for agency owners to understand payment delays, collections risk, and cash-flow leakage.",
  title: "Free Agency Tools | Duely",
};

const tools = [
  {
    description:
      "Estimate how much cash is tied up in delayed client payments and get a personalized collections report.",
    href: "/payment-leak-calculator",
    icon: Calculator,
    label: "Agency Payment Leak Calculator",
    status: "Available now",
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <Image
              src="/logo.svg"
              width={36}
              height={36}
              alt="Duely Logo"
              className="h-9 w-9 rounded-lg shadow-sm"
            />
            <span className="text-lg font-semibold text-zinc-50">Duely</span>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="hidden sm:inline-flex">
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Container>
      </header>

      <main>
        <section className="border-b border-white/10 py-12 sm:py-16">
          <Container>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Duely Tools
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
              Free tools for agency cash-flow diagnostics.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              Use these calculators to spot delayed-payment risk before it turns into a collections problem.
            </p>
          </Container>
        </section>

        <section className="py-10 sm:py-12">
          <Container>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tools.map((tool) => {
                const Icon = tool.icon;

                return (
                  <Link key={tool.href} href={tool.href} className="group block">
                    <Card className="h-full border-white/10 bg-white/[0.03] transition-colors group-hover:bg-white/[0.06]">
                      <CardHeader>
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle>{tool.label}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-6 text-zinc-400">{tool.description}</p>
                        <div className="mt-6 flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                            {tool.status}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-300">
                            Open tool
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}

              <Card className="border-dashed border-white/10 bg-white/[0.015]">
                <CardHeader>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <CardTitle>More tools coming soon</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-zinc-500">
                    We will add more agency-focused diagnostics for receivables, follow-up timing, and payment promise tracking.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
