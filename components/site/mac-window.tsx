import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MacWindowProps {
  children: ReactNode;
  className?: string;
  title?: string | ReactNode;
  icon?: ReactNode;
  shadow?: string;
}

export function MacWindow({
  children,
  className,
  title = "Duely App",
  icon,
  shadow = "shadow-indigo-500/10",
}: MacWindowProps) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl backdrop-blur-sm overflow-hidden flex flex-col relative",
        shadow,
        className
      )}
    >
      {/* Mock Browser/Dashboard Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.01]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-zinc-800" />
          <div className="w-3 h-3 rounded-full bg-zinc-800" />
          <div className="w-3 h-3 rounded-full bg-zinc-800" />
        </div>
        <div className="ml-4 text-xs font-medium text-zinc-600 flex items-center gap-2">
          {icon}
          {title}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden bg-zinc-950/40">
        {children}
      </div>
    </div>
  );
}
