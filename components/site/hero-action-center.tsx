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
    headline: "Broken payment promise",
    clientName: "Acme Corp",
    amount: "$15,400",
    context: "Client promised to pay by Friday. It's now Monday and no payment has been received.",
    primaryAction: "Send Firm Follow-up",
  },
  {
    id: "a2",
    type: "critical",
    headline: "Automation exhausted",
    clientName: "Globex Inc",
    amount: "$8,200",
    context: "3-email sequence finished yesterday with no response. 32 days overdue.",
    primaryAction: "Pause Services Warning",
  },
  {
    id: "a3",
    type: "system",
    headline: "Global Minor Offender Pattern",
    clientName: "5 Clients",
    amount: "$4,200",
    context: "You have 5 clients sitting in the 1-3 days late bucket. Turn on Global Gentle Reminders.",
    primaryAction: "Enable Automation",
  },
  {
    id: "a4",
    type: "moderate",
    headline: "Standard overdue",
    clientName: "Initech LLC",
    amount: "$2,150",
    context: "14 days overdue. No broken promises, but getting stale.",
    primaryAction: "Friendly Check-in",
  },
  {
    id: "a5",
    type: "chill",
    headline: "Historically great payer",
    clientName: "Stark Industries",
    amount: "$12,000",
    context: "Only 2 days late. Good payer (Avg 1 day overdue). Probably just forgot.",
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
    <div className="w-full rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl shadow-indigo-500/10 backdrop-blur-sm overflow-hidden flex flex-col h-[600px]">
      {/* Mock Browser/Dashboard Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.01]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-zinc-800" />
          <div className="w-3 h-3 rounded-full bg-zinc-800" />
          <div className="w-3 h-3 rounded-full bg-zinc-800" />
        </div>
        <div className="ml-4 text-xs font-medium text-zinc-600 flex items-center gap-2">
          <Zap className="w-3 h-3 text-indigo-500" />
          Duely App
        </div>
      </div>

      {/* App Layout */}
      <div className="flex flex-1 overflow-hidden bg-zinc-950/40">
        
        {/* Sidebar */}
        <div className="w-16 sm:w-48 border-r border-white/5 bg-zinc-950/80 flex flex-col items-center sm:items-start py-6 px-2 sm:px-4 gap-4">
          <div className="hidden sm:block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 px-2">Menu</div>
          <div className="w-full flex sm:justify-start justify-center items-center gap-3 p-2 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="hidden sm:block text-sm font-medium">Dashboard</span>
          </div>
          <div className="w-full flex sm:justify-start justify-center items-center gap-3 p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CheckSquare className="w-5 h-5 shrink-0" />
            <span className="hidden sm:block text-sm font-medium">Action Center</span>
          </div>
          <div className="w-full flex sm:justify-start justify-center items-center gap-3 p-2 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
            <FileText className="w-5 h-5 shrink-0" />
            <span className="hidden sm:block text-sm font-medium">Invoices</span>
          </div>
          <div className="w-full flex sm:justify-start justify-center items-center gap-3 p-2 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
            <Users className="w-5 h-5 shrink-0" />
            <span className="hidden sm:block text-sm font-medium">Customers</span>
          </div>
          <div className="w-full flex sm:justify-start justify-center items-center gap-3 p-2 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
            <Activity className="w-5 h-5 shrink-0" />
            <span className="hidden sm:block text-sm font-medium">Analytics</span>
          </div>
          <div className="mt-auto w-full flex sm:justify-start justify-center items-center gap-3 p-2 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
            <Settings className="w-5 h-5 shrink-0" />
            <span className="hidden sm:block text-sm font-medium">Settings</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 pb-20 custom-scrollbar relative">
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
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className={cn("mt-1 flex shrink-0 rounded-lg p-2.5", style.badgeBg)}>
                          <Icon className={cn("h-4 w-4", style.iconColor)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-zinc-100 text-base">{action.headline}</h3>
                            {action.type === 'critical' && active && (
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">{action.context}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-medium text-zinc-300">{action.clientName}</div>
                        <div className="text-lg font-bold text-zinc-100">{action.amount}</div>
                      </div>
                    </div>

                    <div className={cn(
                      "flex items-center justify-end gap-3 pt-4 mt-4 border-t transition-all duration-500 overflow-hidden",
                      active ? "border-white/10 opacity-100 max-h-20" : "border-white/5 opacity-0 max-h-0 pt-0 mt-0 border-transparent"
                    )}>
                      {action.type !== 'system' && (
                        <>
                          <button className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors px-3">
                            Snooze
                          </button>
                          <button className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors px-3">
                            Log Promise
                          </button>
                        </>
                      )}
                      <button className={cn(
                        "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg transition-all",
                        style.btnColor
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
    </div>
  );
}
