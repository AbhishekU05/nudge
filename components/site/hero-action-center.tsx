"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Activity, ArrowRight, Zap, Info, Play, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type MockAction = {
  id: string;
  type: "critical" | "moderate" | "chill" | "system";
  headline: string;
  clientName: string;
  amount: string;
  description: string;
  primaryAction: string;
};

const ACTIONS: MockAction[] = [
  {
    id: "a1",
    type: "critical",
    headline: "Broken payment promise",
    clientName: "Acme Corp",
    amount: "$15,400",
    description: "Client promised to pay by Friday. It's now Monday and no payment has been received.",
    primaryAction: "Send Firm Follow-up",
  },
  {
    id: "a2",
    type: "system",
    headline: "High volume of early late payers",
    clientName: "5 Clients",
    amount: "$4,200",
    description: "You have 5 clients between 1-3 days overdue. Turn on global automation to handle these.",
    primaryAction: "Enable Gentle Reminders",
  },
];

const STYLES = {
  critical: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    badgeBg: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    btnColor: "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20",
  },
  system: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: Activity,
    iconColor: "text-purple-400",
    btnColor: "bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/20",
  },
};

export function HeroActionCenter() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % ACTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl shadow-indigo-500/10 backdrop-blur-sm overflow-hidden flex flex-col">
      {/* Mock Browser/Dashboard Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.01]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-zinc-800" />
          <div className="w-3 h-3 rounded-full bg-zinc-800" />
          <div className="w-3 h-3 rounded-full bg-zinc-800" />
        </div>
        <div className="ml-4 text-xs font-medium text-zinc-600 flex items-center gap-2">
          <Zap className="w-3 h-3 text-indigo-500" />
          Duely Action Center
        </div>
      </div>

      <div className="p-4 sm:p-5 bg-zinc-950/40">
        <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50">Action Center</h2>
            <p className="mt-1 text-sm text-zinc-400">Inbox zero for your collections</p>
          </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
            1 Critical
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {ACTIONS.map((action, i) => {
          const style = STYLES[action.type as keyof typeof STYLES];
          const Icon = style.icon;
          const active = i === activeIndex;

          return (
            <div
              key={action.id}
              className={cn(
                "overflow-hidden rounded-xl border transition-all duration-500",
                style.border,
                active ? style.bg : "bg-white/[0.02] border-white/[0.05]",
                active ? "ring-1 ring-white/10" : "opacity-80"
              )}
            >
              <div className="p-4">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className={cn("mt-1 flex shrink-0 rounded-lg p-2", style.badgeBg)}>
                      <Icon className={cn("h-4 w-4", style.iconColor)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-100">{action.headline}</h3>
                      <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{action.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-zinc-300">{action.clientName}</div>
                    <div className="text-lg font-semibold text-zinc-100">{action.amount}</div>
                  </div>
                </div>

                <div className={cn(
                  "flex items-center justify-end gap-3 pt-3 border-t transition-colors",
                  active ? "border-white/10" : "border-white/5"
                )}>
                  <button className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
                    Dismiss
                  </button>
                  <button className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg transition-all",
                    style.btnColor,
                    active ? "translate-y-0 opacity-100" : "opacity-70"
                  )}>
                    {action.primaryAction}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}
