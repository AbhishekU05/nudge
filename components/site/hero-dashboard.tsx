"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Clock, ChevronRight, Zap, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type ClientRow = {
  initials: string;
  name: string;
  email: string;
  amount: string;
  amountPaid?: string;
  due: string;
  status: "overdue" | "promised" | "partial" | "paid";
  daysOverdue?: number;
  promisedDate?: string;
  paidPct?: number;
};

const CLIENTS: ClientRow[] = [
  {
    initials: "SO",
    name: "Sarah Okafor",
    email: "sarah@clientco.com",
    amount: "$2,400",
    due: "May 10",
    status: "overdue",
    daysOverdue: 15,
  },
  {
    initials: "DA",
    name: "David Anand",
    email: "david@acmecorp.com",
    amount: "$4,200",
    due: "May 30",
    status: "promised",
    promisedDate: "May 30",
  },
  {
    initials: "MR",
    name: "Marcus Reid",
    email: "marcus@reidstudio.io",
    amount: "$1,800",
    amountPaid: "$600 paid",
    due: "May 20",
    status: "partial",
    paidPct: 33,
  },
  {
    initials: "PL",
    name: "Priya Lal",
    email: "priya@brightleaf.co",
    amount: "$950",
    due: "May 5",
    status: "paid",
  },
] as ClientRow[];

const STATUS_CONFIG = {
  overdue: {
    badge: (d?: number) => `${d}d overdue`,
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-300",
    icon: AlertTriangle,
    iconClass: "text-red-400",
  },
  promised: {
    badge: (d?: number, p?: string) => `Promised ${p}`,
    badgeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    icon: Clock,
    iconClass: "text-indigo-400",
  },
  partial: {
    badge: () => "Partial",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    icon: Zap,
    iconClass: "text-blue-400",
  },
  paid: {
    badge: () => "Paid",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
  },
};

// Pulse dot for active row
function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", color)} />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", color)} />
    </span>
  );
}

function ClientCard({ client, active }: { client: ClientRow; active: boolean }) {
  const cfg = STATUS_CONFIG[client.status];
  const Icon = cfg.icon;
  const isPaid = client.status === "paid";

  return (
    <div
      className={cn(
        "group rounded-2xl border transition-all duration-500",
        active
          ? "border-white/20 bg-white/[0.05] shadow-lg shadow-indigo-500/5"
          : "border-white/[0.06] bg-white/[0.02]",
        isPaid && "opacity-50",
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Avatar + info */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xs font-semibold text-zinc-300">
            {client.initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100">{client.name}</span>
              {active && !isPaid && (
                <PulseDot color={client.status === "overdue" ? "bg-red-400" : client.status === "promised" ? "bg-indigo-400" : "bg-blue-400"} />
              )}
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", cfg.badgeClass)}>
                {client.status === "overdue"
                  ? cfg.badge(client.daysOverdue)
                  : client.status === "promised"
                  ? cfg.badge(undefined, client.promisedDate)
                  : cfg.badge()}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-zinc-600">{client.email}</p>
          </div>
        </div>

        {/* Amount + chevron */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-100">{client.amount}</p>
            {client.amountPaid && (
              <p className="text-xs text-zinc-600">{client.amountPaid}</p>
            )}
            {client.due && !isPaid && (
              <p className={cn("text-xs", client.status === "overdue" ? "text-red-400" : "text-zinc-600")}>
                Due {client.due}
              </p>
            )}
          </div>
          <ChevronRight className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-zinc-400" : "text-zinc-700")} />
        </div>
      </div>

      {/* Partial payment bar */}
      {client.status === "partial" && client.paidPct !== undefined && (
        <div className="px-4 pb-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-emerald-500/70 transition-all duration-1000"
              style={{ width: `${client.paidPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick actions strip for active non-paid rows */}
      {active && !isPaid && (
        <div className="flex items-center gap-1 border-t border-white/[0.04] px-4 py-1.5">
          <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500">
            <MessageSquare className="h-3 w-3" />Follow up
          </span>
          <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500">
            <Zap className="h-3 w-3" />Automate
          </span>
        </div>
      )}
    </div>
  );
}

export function HeroDashboard() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Cycle highlight through rows
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % CLIENTS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const totalOutstanding = "$8,450";

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-2xl shadow-black/60 backdrop-blur-sm">
      {/* Mini header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Collections</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-50">{totalOutstanding}</p>
          <p className="text-xs text-zinc-600">outstanding across 3 clients</p>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col items-center rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            <p className="mt-1 text-sm font-semibold text-zinc-100">1</p>
            <p className="text-[10px] text-zinc-600">Overdue</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-border bg-white/[0.025] px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <p className="mt-1 text-sm font-semibold text-zinc-100">1</p>
            <p className="text-[10px] text-zinc-600">Paid</p>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Outstanding</span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-zinc-500">3</span>
      </div>

      {/* Client rows */}
      <div className="space-y-2">
        {CLIENTS.map((client, i) => (
          <ClientCard key={client.name} client={client} active={i === activeIndex} />
        ))}
      </div>
    </div>
  );
}
