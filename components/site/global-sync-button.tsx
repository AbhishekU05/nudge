"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { syncIntegrationBackground } from "@/app/actions/integrations";
import { cn } from "@/lib/utils";

export function GlobalSyncButton({ isExpanded, provider }: { isExpanded: boolean; provider: 'xero' | 'quickbooks' }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleSync = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await syncIntegrationBackground(provider);
      setMessage({
        text: res.message,
        type: res.success ? 'success' : 'error'
      });
      setTimeout(() => setMessage(null), 3000);
    });
  };

  return (
    <div className="relative flex w-full">
      <button
        onClick={handleSync}
        disabled={isPending}
        className={cn(
          "w-full flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 disabled:opacity-50",
          !isExpanded && "justify-center"
        )}
        title={`Sync ${provider === 'xero' ? 'Xero' : 'QuickBooks'}`}
      >
        <RefreshCw className={cn("h-5 w-5 shrink-0", isPending && "animate-spin text-indigo-400")} />
        {isExpanded && <span className="text-sm font-medium">Sync</span>}
      </button>

      {message && isExpanded && (
        <div className={cn(
          "absolute left-0 top-full mt-2 w-48 rounded-md px-3 py-2 text-xs shadow-lg z-50",
          message.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
        )}>
          {message.text}
        </div>
      )}
    </div>
  );
}
