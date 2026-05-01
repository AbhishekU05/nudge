"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

export function Button({
  className,
  variant = "primary",
  size = "md",
  type,
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  const { pending } = useFormStatus();
  const isPending = type === "submit" && pending;

  return (
    <button
      type={type}
      disabled={disabled || isPending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-11 px-5 text-sm",
        variant === "primary" &&
          "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" &&
          "border-white/10 bg-white/[0.06] text-zinc-100 hover:bg-white/[0.1]",
        variant === "danger" &&
          "border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/15",
        variant === "ghost" &&
          "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100",
        className,
      )}
      {...props}
    >
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
