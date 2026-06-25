import type { ReactNode } from "react";
import Image from "next/image";
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
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 selection:bg-indigo-500/30 p-6 sm:p-12">
      {/* Subtle background gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.10),transparent_50%)] animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[80%] bg-[radial-gradient(circle_at_bottom,rgba(168,85,247,0.07),transparent_40%)]" />
      </div>

      <div className="relative z-10 w-full max-w-sm xl:max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2.5">
          <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-70">
            <Image src="/logo.svg" alt="Duely" width={22} height={24} priority />
            <span className="text-lg font-bold tracking-tight text-zinc-50">Duely</span>
          </Link>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-zinc-400">{description}</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
          <div className="absolute -inset-1 -z-10 rounded-[1.5rem] bg-gradient-to-b from-indigo-500/10 to-transparent opacity-50 blur-xl" />
          {children}
        </div>
      </div>
    </div>
  );
}
