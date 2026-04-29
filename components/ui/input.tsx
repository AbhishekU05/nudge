import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-white/[0.04] px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-primary/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    />
  );
}
