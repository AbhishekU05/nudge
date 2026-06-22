"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { syncIntegrationBackground } from "@/app/actions/integrations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function GlobalSyncButton({ isExpanded, provider }: { isExpanded: boolean; provider: 'xero' | 'quickbooks' }) {
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      const res = await syncIntegrationBackground(provider);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
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
    </div>
  );
}
