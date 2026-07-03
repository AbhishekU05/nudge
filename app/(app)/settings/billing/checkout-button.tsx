"use client";

import { useTransition, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionResponse {
  url?: string;
  error?: string;
}

export function CheckoutButton({
  action,
  plan,
  variant,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<ActionResponse>;
  plan?: string;
  variant: "monthly" | "annual" | "cancel";
  children: React.ReactNode;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClick = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const formData = new FormData();
      if (plan) formData.append("plan", plan);

      // Read Affonso referral cookie set by the tracking pixel and pass it
      // to the server action so it gets stored in Dodo checkout metadata.
      try {
        const affonsoReferral = document.cookie
          .split("; ")
          .find((row) => row.startsWith("affonso_referral="))
          ?.split("=")[1];
        if (affonsoReferral) {
          formData.append("affonso_referral", decodeURIComponent(affonsoReferral));
        }
      } catch {
        // Cookie reading failed — not critical, proceed without it
      }
      
      try {
        const result = await action(formData);
        if (result?.error) {
          setErrorMsg(result.error);
        } else if (result?.url) {
          window.location.href = result.url;
        }
      } catch (err) {
        console.error("Checkout action failed:", err);
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <div className="w-full">
      <Button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        variant={variant === "cancel" ? "secondary" : "primary"}
        className={className}
      >
        {variant === "annual" && <Sparkles className="h-4 w-4 mr-2" />}
        {isPending ? "Processing..." : children}
      </Button>
      {errorMsg && (
        <p className="mt-2 text-xs text-red-400 text-center">{errorMsg}</p>
      )}
    </div>
  );
}
