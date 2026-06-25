import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Zap, Clock, TrendingUp, MessageSquare } from "lucide-react";

const FEATURES = [
  {
    icon: Clock,
    label: "Automated follow-ups",
    sublabel: "Sent from your own email address",
  },
  {
    icon: TrendingUp,
    label: "Track every promise",
    sublabel: "Payment dates, partials, and disputes",
  },
  {
    icon: MessageSquare,
    label: "Gentle, not pushy",
    sublabel: "Keeps client relationships intact",
  },
];

const STATS = [
  { value: "3.2×", label: "faster collections" },
  { value: "80%", label: "less manual chasing" },
  { value: "$0", label: "awkward phone calls" },
];

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
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-zinc-950 selection:bg-indigo-500/30">
      {/* Left Panel */}
      <div className="relative hidden w-full lg:flex lg:w-1/2 xl:w-[45%] flex-col justify-between overflow-hidden bg-zinc-950 p-12 lg:p-16 border-r border-white/5">
        {/* Background gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute top-0 -left-1/4 w-[150%] h-full bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.13),transparent_50%)] animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          <div className="absolute bottom-0 -right-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_bottom,rgba(168,85,247,0.10),transparent_40%)]" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
              <Zap className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-50">Duely</span>
          </Link>

          {/* Headline */}
          <div className="mt-14 max-w-md">
            <h1 className="text-[2.6rem] font-semibold leading-[1.12] tracking-[-0.04em] text-white">
              Get paid faster.{" "}
              <span className="text-indigo-400">Without the awkwardness.</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-zinc-400">
              Duely tracks your overdue invoices, logs payment promises, and sends
              polite follow-ups automatically—so you can focus on the work, not the
              chasing.
            </p>
          </div>

          {/* Stat strip */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 text-center backdrop-blur-sm"
              >
                <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
                <p className="mt-1 text-[0.7rem] uppercase tracking-widest text-zinc-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <ul className="mt-8 space-y-3">
            {FEATURES.map(({ icon: Icon, label, sublabel }) => (
              <li key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <Icon className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{label}</p>
                  <p className="text-xs text-zinc-500">{sublabel}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Quote card */}
          <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-4 backdrop-blur-sm">
            <p className="text-sm leading-relaxed text-zinc-400">
              &ldquo;I used to spend hours writing follow-up emails every Friday. Duely
              does it for me and I've cut my outstanding receivables in half.&rdquo;
            </p>
            <p className="mt-3 text-xs font-medium text-zinc-500">
              — Freelance designer, 3 months on Duely
            </p>
          </div>
        </div>

        {/* Footer trust badges */}
        <div className="relative z-10 flex items-center gap-6 text-xs font-medium text-zinc-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
            <span>Bank-level security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
            <span>Stripe integrated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
            <span>No credit card to start</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
        {/* Mobile logo */}
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-500/30">
              <Zap className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-50">Duely</span>
          </Link>
        </div>

        <div className="w-full max-w-sm xl:max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-semibold tracking-tight text-white">{title}</h2>
            <p className="mt-2 text-zinc-400">{description}</p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-zinc-900/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
            <div className="absolute -inset-1 -z-10 rounded-[2rem] bg-gradient-to-b from-indigo-500/10 to-transparent opacity-50 blur-xl" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
