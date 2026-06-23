import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageSquare, Clock, FileText, Link as LinkIcon, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about Duely, the collections management tool for freelancers, small agencies, and independent consultants.",
  alternates: { canonical: "/about" },
};

const features = [
  {
    title: "Track outstanding balances",
    description: "Keep a clear, unified view of all unpaid invoices and accounts receivable across your client base.",
    icon: FileText,
  },
  {
    title: "Log partial payments",
    description: "Easily record when clients pay in installments without losing track of the remaining balance.",
    icon: CheckCircle2,
  },
  {
    title: "Record payment promises",
    description: "Log client commitments and exact dates they promise to pay, so nothing slips through the cracks.",
    icon: Clock,
  },
  {
    title: "Draft follow-up messages",
    description: "Generate professional, tactful follow-up messages to gently nudge clients who are past due.",
    icon: MessageSquare,
  },
  {
    title: "Add client notes",
    description: "Keep internal context on client relationships, payment history, and past conversations.",
    icon: Users,
  },
  {
    title: "Automated payment reminders",
    description: "Send scheduled reminders equipped with direct payment links to get paid faster.",
    icon: LinkIcon,
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* ── Hero ── */}
        <section className="border-b border-white/5 bg-gradient-to-b from-indigo-950/20 to-transparent">
          <Container className="py-20 sm:py-28 text-center">
            <h1 className="mx-auto max-w-4xl text-pretty text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl lg:text-6xl">
              About Duely
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400">
              The collections management tool designed to help you get paid professionally.
            </p>
            <div className="mt-10 flex justify-center">
              <Link href="/signup">
                <Button size="lg" className="shadow-lg shadow-indigo-500/20">
                  Get started
                </Button>
              </Link>
            </div>
          </Container>
        </section>

        {/* ── Entity Definition ── */}
        <section className="border-b border-white/5 py-16 sm:py-24">
          <Container>
            <div className="mx-auto max-w-3xl space-y-16">
              
              {/* What Duely Is */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
                  What is Duely?
                </h2>
                <p className="mt-4 text-2xl font-medium leading-relaxed text-zinc-100 sm:text-3xl">
                  Duely is a collections management tool built specifically for modern service businesses.
                </p>
                <p className="mt-4 text-base leading-7 text-zinc-400">
                  We bridge the gap between sending an invoice and actually getting paid. Instead of letting overdue invoices pile up or manually tracking promises in spreadsheets, Duely gives you a dedicated workspace to manage accounts receivable efficiently and professionally.
                </p>
              </div>

              {/* Who It&apos;s For */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 sm:p-10">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
                  Who it&apos;s for
                </h2>
                <p className="mt-4 text-lg leading-8 text-zinc-300">
                  Duely is crafted exclusively for independent professionals and small teams who rely on timely payments to keep their business running smoothly:
                </p>
                <ul className="mt-6 space-y-4">
                  {[
                    "Freelancers",
                    "Small agency owners",
                    "Independent consultants",
                  ].map((audience) => (
                    <li key={audience} className="flex items-center gap-3 text-zinc-200">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{audience}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
            </div>
          </Container>
        </section>

        {/* ── What It Does ── */}
        <section className="py-16 sm:py-24">
          <Container>
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-4xl">
                What Duely does
              </h2>
              <p className="mt-4 text-zinc-400 leading-7">
                Everything you need to confidently manage your collections workflow, all in one place.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-7 transition-colors hover:border-indigo-500/30 hover:bg-white/[0.04]"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-3 font-semibold text-zinc-100">{title}</h3>
                  <p className="text-sm leading-6 text-zinc-400">{description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </main>

      {/* ── Footer ── */}
      <SiteFooter />
    </div>
  );
}
