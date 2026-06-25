import type { ReactNode } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

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
      <div className="relative hidden w-full lg:flex lg:w-1/2 xl:w-[45%] items-center justify-center overflow-hidden bg-zinc-950 border-r border-white/5">
        {/* Subtle gradient */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute top-0 -left-1/4 w-[150%] h-full bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.10),transparent_50%)] animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          <div className="absolute bottom-0 -right-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_bottom,rgba(168,85,247,0.07),transparent_40%)]" />
        </div>

        <Link href="/" className="relative z-10 inline-flex items-center gap-3 transition-opacity hover:opacity-70">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <Zap className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-zinc-50">Duely</span>
        </Link>
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
