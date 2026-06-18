"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { captureLead } from "@/app/actions/leads";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

export function HeroEmailCapture({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    startTransition(async () => {
      await captureLead(trimmedEmail);
      const params = new URLSearchParams({ email: trimmedEmail });
      router.push(`/signup?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className={className || "mt-9 max-w-md"}>
      <label htmlFor="email-input" className="sr-only">
        Email address
      </label>
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-2 shadow-2xl shadow-indigo-950/20 backdrop-blur sm:flex-row">
        <div className="min-w-0 flex-1">
          <Input
            id="email-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            className="h-12 border-transparent bg-transparent text-base focus:bg-white/[0.04]"
            required
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="h-12 shrink-0 px-5 shadow-lg shadow-indigo-950/40"
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-3 text-xs text-zinc-600">
          No credit card required. You can set up your first customer after signup.
        </p>
      )}
    </form>
  );
}
