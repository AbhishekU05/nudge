import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, ClipboardList, Clock, FileText, DollarSign, Receipt, ShieldCheck } from "lucide-react";

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

type Tool = {
  description: string;
  href: string;
  icon: typeof Calculator;
  label: string;
  status: "available" | "coming-soon";
};

const tools: Tool[] = [
  {
    description:
      "Estimate how much working capital is trapped in delayed client payments.",
    href: "/tools/payment-leak-calculator",
    icon: Calculator,
    label: "Agency Payment Leak Estimator",
    status: "available",
  },
  {
    description:
      "Evaluate the maturity of your collections process and identify operational weaknesses.",
    href: "/tools/collections-maturity-assessment",
    icon: ClipboardList,
    label: "Collections Maturity Assessment",
    status: "available",
  },
];

const comingSoon: Array<{ label: string; icon: typeof Calculator }> = [
  { label: "Invoice Follow-Up Generator", icon: FileText },
  { label: "Revenue At Risk Estimator", icon: DollarSign },
  { label: "Collections ROI Calculator", icon: Receipt },
  { label: "Payment Terms Generator", icon: FileText },
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
              Use these tools to diagnose delayed-payment risk and evaluate your collections process before problems escalate.
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
                            Available now
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-300">
                            Open Tool
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}

              {comingSoon.map((tool) => {
                const Icon = tool.icon;

                return (
                  <Card key={tool.label} className="border-dashed border-white/10 bg-white/[0.015]">
                    <CardHeader>
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-zinc-500">{tool.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-500">
                        <Clock className="h-3.5 w-3.5" />
                        Coming soon
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
