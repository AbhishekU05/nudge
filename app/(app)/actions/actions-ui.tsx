"use client";

import { ActionTask } from "@/lib/action-engine";
import { Zap, AlertCircle, AlertTriangle, Coffee, Info, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function ActionCard({ task }: { task: ActionTask }) {
  let borderClass = "";
  let bgClass = "";
  let textClass = "";
  let icon = null;
  let badgeClass = "";

  if (task.category === "critical") {
    borderClass = "border-red-500/30";
    bgClass = "bg-red-500/5 hover:bg-red-500/10";
    textClass = "text-red-400";
    badgeClass = "bg-red-500/10 text-red-400 border border-red-500/20";
    icon = <AlertCircle className="h-5 w-5 text-red-400" />;
  } else if (task.category === "moderate") {
    borderClass = "border-amber-500/30";
    bgClass = "bg-amber-500/5 hover:bg-amber-500/10";
    textClass = "text-amber-400";
    badgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    icon = <AlertTriangle className="h-5 w-5 text-amber-400" />;
  } else if (task.category === "chill") {
    borderClass = "border-emerald-500/30";
    bgClass = "bg-emerald-500/5 hover:bg-emerald-500/10";
    textClass = "text-emerald-400";
    badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    icon = <Coffee className="h-5 w-5 text-emerald-400" />;
  } else if (task.category === "system") {
    borderClass = "border-purple-500/30";
    bgClass = "bg-purple-500/5 hover:bg-purple-500/10";
    textClass = "text-purple-400";
    badgeClass = "bg-purple-500/10 text-purple-400 border border-purple-500/20";
    icon = <Info className="h-5 w-5 text-purple-400" />;
  }

  const currency = "USD";

  return (
    <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-start gap-6 ${borderClass} ${bgClass} group`}>
      <div className={`mt-1 shrink-0 p-3 rounded-full bg-black/40 ${textClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-xl font-semibold text-zinc-50 tracking-tight">
            {task.clientName}
          </h3>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full uppercase tracking-wider ${badgeClass}`}>
            {task.category}
          </span>
        </div>
        <p className="mt-2 text-base text-zinc-300 leading-relaxed max-w-3xl">
          {task.contextText}
        </p>
        <div className="mt-6 flex items-center gap-3">
          {task.category === "system" ? (
            <Link 
              href="/automate" 
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border ${borderClass} bg-black/40 hover:bg-black/60 transition-colors ${textClass}`}
            >
              Configure Settings <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link 
              href={`/invoices/${task.primaryInvoiceId}`} 
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border ${borderClass} bg-black/40 hover:bg-black/60 transition-colors ${textClass}`}
            >
              {task.recommendation === "firm_nudge" && "Send Firm Nudge"}
              {task.recommendation === "friendly_checkin" && "Send Friendly Nudge"}
              {task.recommendation === "light_nudge" && "Send Light Nudge"}
              {task.recommendation === "reply_needed" && "Reply to Client"}
              {(!["firm_nudge", "friendly_checkin", "light_nudge", "reply_needed"].includes(task.recommendation)) && "Follow up"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
      
      {(task.totalOwed > 0 || task.maxDaysOverdue > 0) && (
        <div className="w-full sm:w-auto mt-4 sm:mt-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 sm:gap-2 shrink-0 bg-black/20 sm:bg-transparent p-4 sm:p-0 rounded-xl">
          {task.totalOwed > 0 && (
            <div className="text-left sm:text-right">
              <div className="text-sm font-medium text-zinc-400 mb-0.5">At Risk</div>
              <div className="text-2xl font-bold text-zinc-100">{formatCurrency(task.totalOwed, currency)}</div>
            </div>
          )}
          {task.maxDaysOverdue > 0 && (
            <div className="text-right">
              <div className="text-sm font-medium text-zinc-400 mb-0.5">Overdue</div>
              <div className="text-lg font-semibold text-red-400">{task.maxDaysOverdue} Days</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ActionsUI({ tasks, isAllUnder3Days = false }: { tasks: ActionTask[], isAllUnder3Days?: boolean }) {
  const visibleTasks = tasks.filter(t => t.category !== "hidden");
  const noTasks = visibleTasks.length === 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl flex items-center gap-3">
          <Zap className="h-10 w-10 text-amber-400" /> Action Center
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-500">
          Your intelligent queue of prioritized follow-ups and account interventions.
        </p>
      </div>

      {noTasks ? (
        isAllUnder3Days ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="bg-emerald-500/10 p-4 rounded-full mb-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-medium text-zinc-100 tracking-tight">All caught up!</h3>
            <p className="text-base text-zinc-400 mt-3 max-w-md">
              We've analyzed your accounting data. Good news! You have no fires to put out today. Relax or focus on other work.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="bg-white/5 p-4 rounded-full mb-6">
              <Coffee className="h-12 w-12 text-zinc-500" />
            </div>
            <h3 className="text-2xl font-medium text-zinc-100 tracking-tight">No pressing actions</h3>
            <p className="text-base text-zinc-400 mt-3 max-w-md">
              There are no immediate tasks right now that require your attention.
            </p>
          </div>
        )
      ) : (
        <div className="grid gap-4">
          {visibleTasks.map((task, i) => (
            <ActionCard key={`${task.clientId}-${i}`} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
