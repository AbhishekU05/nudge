"use client";

import { useEffect, useState } from "react";
import { 
  AlertTriangle, 
  Clock, 
  Activity, 
  ArrowRight, 
  Zap, 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  FileText, 
  Settings, 
  MessageSquare,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MacWindow } from "./mac-window";
import { AppSidebar } from "./app-sidebar";
import { mockUser } from "@/lib/mock-data";

type MockAction = {
  id: string;
  type: "critical" | "moderate" | "chill" | "system";
  headline: string;
  clientName: string;
  amount: string;
  context: string;
  primaryAction: string;
};

const ACTIONS: MockAction[] = [
  {
    id: "a1",
    type: "critical",
    headline: "Follow up on broken promise",
    clientName: "Acme Corp",
    amount: "$15,400",
    context: "Acme Corp promised to pay by Friday, but no payment was received. They are now 18 days late.",
    primaryAction: "Send Firm Follow-up",
  },
  {
    id: "a2",
    type: "critical",
    headline: "Escalate to Final Warning",
    clientName: "Globex Inc",
    amount: "$8,200",
    context: "The 3-email sequence finished yesterday with no response. They are now 32 days overdue.",
    primaryAction: "Pause Services Warning",
  },
  {
    id: "a3",
    type: "system",
    headline: "Automate early reminders",
    clientName: "5 Clients",
    amount: "$4,200",
    context: "You have 5 clients sitting in the 1-3 days late bucket. Turn on 'Global Gentle Reminders' to handle these.",
    primaryAction: "Enable Automation",
  },
  {
    id: "a4",
    type: "moderate",
    headline: "Send a friendly check-in",
    clientName: "Initech LLC",
    amount: "$2,150",
    context: "Initech LLC is 14 days overdue. There are no broken promises, but the invoice is getting stale.",
    primaryAction: "Friendly Check-in",
  },
  {
    id: "a5",
    type: "chill",
    headline: "Send a light nudge",
    clientName: "Stark Industries",
    amount: "$12,000",
    context: "Only 2 days late. Good payer (averages 1 day overdue). They probably just forgot.",
    primaryAction: "Light Nudge",
  },
];

const STYLES = {
  critical: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    badgeBg: "bg-red-500/20 text-red-400 border border-red-500/30",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    btnColor: "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20",
  },
  system: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    badgeBg: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    icon: Zap,
    iconColor: "text-purple-400",
    btnColor: "bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/20",
  },
  moderate: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    badgeBg: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    icon: Clock,
    iconColor: "text-amber-400",
    btnColor: "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20",
  },
  chill: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    badgeBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    icon: MessageSquare,
    iconColor: "text-emerald-400",
    btnColor: "bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/20",
  },
};

export function HeroActionCenter() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % ACTIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MacWindow icon={<Zap className="w-3 h-3 text-indigo-500" />} className="h-[600px]">
      <div className="flex h-full w-full">
        <AppSidebar user={mockUser} subscriptionStatus="active" groups={[]} totalCustomers={12} />
        <div className="flex-1 flex flex-col overflow-hidden relative bg-zinc-950/40">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5 bg-zinc-950/80 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-50">Action Center</h2>
                <div className="mt-1.5 flex items-center gap-3">
                  <p className="text-sm text-zinc-400">You have <span className="text-zinc-200 font-medium">4 manual actions</span> to take today.</p>
                  <div className="h-4 w-px bg-white/10" />
                  <p className="text-xs text-indigo-400/80 flex items-center gap-1.5">
                    <Bot className="w-3 h-3" />
                    Robots at work: 6 automated follow-ups going out
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 pb-20 custom-scrollbar relative">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
            
            {ACTIONS.map((action, i) => {
              const style = STYLES[action.type as keyof typeof STYLES];
              const Icon = style.icon;
              const active = i === activeIndex;

              return (
                <div
                  key={action.id}
                  className={cn(
                    "overflow-hidden rounded-xl border transition-all duration-500 relative z-10",
                    style.border,
                    active ? style.bg : "bg-white/[0.02] border-white/[0.05]",
                    active ? "ring-1 ring-white/10 shadow-lg shadow-black/20" : "opacity-70 hover:opacity-100"
                  )}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className={cn("mt-0.5 flex shrink-0 rounded-lg p-2", style.badgeBg)}>
                          <Icon className={cn("h-4 w-4", style.iconColor)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-zinc-100 text-sm">{action.headline}</h3>
                            {action.type === 'critical' && active && (
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">{action.context}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-medium text-zinc-400 mb-0.5">{action.clientName}</div>
                        <div className="text-base font-bold text-zinc-100">{action.amount}</div>
                      </div>
                    </div>

                    <div className={cn(
                      "flex items-center justify-end gap-2 pt-3 mt-3 border-t transition-all duration-500 overflow-hidden",
                      active ? "border-white/10 opacity-100 max-h-20" : "border-white/5 opacity-0 max-h-0 pt-0 mt-0 border-transparent"
                    )}>
                      {action.type !== 'system' && (
                        <>
                          <button className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors px-2">
                            Snooze
                          </button>
                          <button className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors px-2">
                            Log Promise
                          </button>
                        </>
                      )}
                      <button className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-lg transition-all",
                        style.btnColor
                      )}>
                        {action.primaryAction}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </MacWindow>
  );
}
