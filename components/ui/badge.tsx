import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "muted" | "danger";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium leading-none",
        variant === "default" &&
          "border-primary/25 bg-primary/10 text-indigo-200",
        variant === "success" &&
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
        variant === "warning" &&
          "border-amber-500/20 bg-amber-500/10 text-amber-200",
        variant === "muted" &&
          "border-white/10 bg-white/[0.04] text-zinc-400",
        variant === "danger" &&
          "border-red-500/20 bg-red-500/10 text-red-200",
        className,
      )}
      {...props}
    />
  );
}
