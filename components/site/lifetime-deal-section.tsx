"use client";

import { useState, useTransition } from "react";
import { captureLifetimeDealLead } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/site/scroll-animation";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export function LifetimeDealSection({ spotsLeft }: { spotsLeft: number }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "duplicate" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus("error");
      return;
    }

    startTransition(async () => {
      const res = await captureLifetimeDealLead(trimmedEmail);
      if (res.success) {
        setStatus("success");
      } else if (res.error === "duplicate") {
        setStatus("duplicate");
      } else {
        setStatus("error");
      }
    });
  }

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-background to-amber-500/5 p-8 shadow-2xl sm:p-12">
            <div className="absolute -inset-y-12 -inset-x-12 -z-10 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_50%)]" />
            
            <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-300">
                  <Sparkles className="h-4 w-4" />
                  Founding Member Deal
                </div>
                
                <h3 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                  Lock In Lifetime Access
                </h3>
                <div className="mt-4 flex items-baseline text-4xl font-semibold text-zinc-50">
                  $199
                  <span className="ml-2 text-lg font-normal text-zinc-400">one-time</span>
                </div>
                <p className="mt-4 text-lg text-zinc-300">
                  Pay once. Get paid faster. Forever.
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex -space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`h-2.5 w-2.5 rounded-full border border-black ${i < spotsLeft ? "bg-amber-400" : "bg-white/10"}`} />
                    ))}
                    {[...Array(5)].map((_, i) => (
                      <div key={i+5} className={`h-2.5 w-2.5 rounded-full border border-black ${i + 5 < spotsLeft ? "bg-amber-400" : "bg-white/10"}`} />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-amber-200">
                    {spotsLeft} spots remaining
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
                {status === "success" ? (
                  <div className="flex flex-col items-center justify-center space-y-3 py-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <p className="font-medium text-emerald-300">You&apos;re on the list.</p>
                    <p className="text-sm text-zinc-400">Check your inbox shortly.</p>
                  </div>
                ) : status === "duplicate" ? (
                  <div className="flex flex-col items-center justify-center space-y-3 py-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <p className="font-medium text-blue-300">You&apos;re already on the list.</p>
                    <p className="text-sm text-zinc-400">We&apos;ll be in touch.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="email"
                        placeholder="Your work email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (status === "error") setStatus("idle");
                        }}
                        className="h-12 border-white/10 bg-white/[0.03] text-base"
                        required
                        disabled={isPending}
                      />
                      {status === "error" && (
                        <p className="text-sm text-red-400">Please enter a valid email address.</p>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      size="lg" 
                      disabled={isPending || spotsLeft <= 0}
                      className="h-12 w-full bg-amber-500 text-zinc-950 hover:bg-amber-400"
                    >
                      {spotsLeft <= 0 ? "Sold out" : "Claim your spot"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-center text-xs text-zinc-500">
                      We&apos;ll send you a payment link within a few hours.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
