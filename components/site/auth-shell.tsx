import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Zap, ArrowRight, Activity, Bell } from "lucide-react";

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
      {/* Left Panel - Visuals */}
      <div className="relative hidden w-full lg:flex lg:w-1/2 xl:w-[45%] flex-col justify-between overflow-hidden bg-zinc-950 p-12 lg:p-16 border-r border-white/5">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 -left-1/4 w-[150%] h-full bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.15),transparent_50%)] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 -right-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_bottom,rgba(168,85,247,0.12),transparent_40%)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grid-pattern.svg')] opacity-[0.02] mix-blend-overlay" />
        </div>

        {/* Top Content */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 backdrop-blur-md shadow-lg shadow-indigo-500/20">
               <Zap className="h-5 w-5 text-indigo-400" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-zinc-50">
              Duely
            </span>
          </Link>
          <div className="mt-16 max-w-lg">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white lg:text-5xl lg:leading-[1.1]">
              Automate your accounts receivable seamlessly.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-400">
              Stop chasing clients. Duely acts as your intelligent collections engine, tracking promises, calculating late fees, and gently nudging clients to pay—all from your own email.
            </p>
          </div>
        </div>

        {/* Floating UI Elements (Glassmorphism) */}
        <div className="relative z-10 mt-12 w-full max-w-md">
          {/* Main Floating Card */}
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl transition-transform hover:scale-[1.02] duration-500">
             <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/30">
                    <Activity className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Action Center</p>
                    <p className="text-xs text-zinc-500">Intelligent Triage</p>
                  </div>
                </div>
                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-emerald-400 border border-emerald-500/20">
                  Optimized
                </div>
             </div>
             
             <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3 border border-white/5 transition-colors hover:bg-white/[0.05]">
                  <div className="flex items-center gap-3">
                     <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                     <p className="text-sm font-medium text-zinc-300">Overdue Invoices</p>
                  </div>
                  <p className="font-mono text-sm font-medium text-white">$12,450</p>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3 border border-white/5 transition-colors hover:bg-white/[0.05]">
                  <div className="flex items-center gap-3">
                     <div className="h-2 w-2 rounded-full bg-amber-500" />
                     <p className="text-sm font-medium text-zinc-300">Active Promises</p>
                  </div>
                  <p className="font-mono text-sm font-medium text-white">4 Pending</p>
                </div>
             </div>
          </div>
          
          {/* Small Floating Card */}
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-zinc-900/90 p-4 shadow-xl backdrop-blur-md animate-[bounce_8s_infinite] hover:animate-none hover:scale-105 transition-transform cursor-default">
             <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                   <p className="text-sm font-medium text-white">Smart Cooldowns</p>
                   <p className="text-xs text-zinc-400">Active protection</p>
                </div>
             </div>
          </div>
        </div>

        {/* Footer / Trust badges */}
        <div className="relative z-10 flex items-center gap-8 text-sm font-medium text-zinc-500">
          <div className="flex items-center gap-2 transition-colors hover:text-zinc-300">
            <CheckCircle2 className="h-4 w-4 text-indigo-400" />
            <span>Bank-level security</span>
          </div>
          <div className="flex items-center gap-2 transition-colors hover:text-zinc-300">
            <CheckCircle2 className="h-4 w-4 text-indigo-400" />
            <span>Stripe integrated</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Content */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
        {/* Mobile Header */}
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-500/30">
               <Zap className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-50">
              Duely
            </span>
          </Link>
        </div>

        <div className="w-full max-w-sm xl:max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-semibold tracking-tight text-white">{title}</h2>
            <p className="mt-2 text-zinc-400">{description}</p>
          </div>
          
          <div className="rounded-3xl border border-white/5 bg-zinc-900/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
             {/* Glow effect behind the form */}
             <div className="absolute -inset-1 -z-10 rounded-[2rem] bg-gradient-to-b from-indigo-500/10 to-transparent opacity-50 blur-xl" />
             {children}
          </div>
        </div>
      </div>
    </div>
  );
}
