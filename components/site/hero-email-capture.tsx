"use client";

import { useRef, useState, useTransition } from "react";
import { signup } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

export function HeroEmailCapture() {
  const [heroEmail, setHeroEmail] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const backdropRef = useRef<HTMLDivElement>(null);

  function openModal(e: React.FormEvent) {
    e.preventDefault();
    if (!heroEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(heroEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setError(null);
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) closeModal();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = fd.get("password") as string;
    const confirm = fd.get("confirm_password") as string;
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    startTransition(() => {
      signup(fd).catch((err: unknown) => {
        // Server action redirects on success — errors surface as thrown strings
        if (err instanceof Error) setError(err.message);
      });
    });
  }

  return (
    <>
      {/* ── Inline hero capture ── */}
      <form onSubmit={openModal} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1 min-w-0">
          <Input
            id="hero-email"
            type="email"
            placeholder="you@example.com"
            value={heroEmail}
            onChange={(e) => { setHeroEmail(e.target.value); setError(null); }}
            className="h-11 text-base"
            required
          />
          {error && !modalOpen && (
            <p className="mt-2 text-xs text-red-400">{error}</p>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          className="shrink-0 h-11 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 transition-all"
        >
          Get started
        </Button>
      </form>

      {/* ── Modal ── */}
      {modalOpen && (
        <div
          ref={backdropRef}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signup-modal-title"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0e0e10] p-8 shadow-2xl shadow-black/60">
            {/* close */}
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2
              id="signup-modal-title"
              className="text-xl font-semibold tracking-tight text-zinc-50"
            >
              Create your account
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Set up automatic payment reminders in minutes.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input type="hidden" name="next" value="/dashboard" />

              {/* Full name */}
              <div className="space-y-1.5">
                <label htmlFor="modal-full-name" className="block text-sm font-medium text-zinc-300">
                  Full name
                </label>
                <Input
                  id="modal-full-name"
                  name="full_name"
                  type="text"
                  placeholder="Jane Doe"
                  required
                />
              </div>

              {/* Email — pre-filled, readonly */}
              <div className="space-y-1.5">
                <label htmlFor="modal-email" className="block text-sm font-medium text-zinc-300">
                  Email
                </label>
                <Input
                  id="modal-email"
                  name="email"
                  type="email"
                  value={heroEmail}
                  onChange={(e) => setHeroEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="modal-password" className="block text-sm font-medium text-zinc-300">
                  Password
                </label>
                <Input
                  id="modal-password"
                  name="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                />
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label htmlFor="modal-confirm" className="block text-sm font-medium text-zinc-300">
                  Confirm password
                </label>
                <Input
                  id="modal-confirm"
                  name="confirm_password"
                  type="password"
                  placeholder="Repeat your password"
                  minLength={8}
                  required
                />
              </div>

              {error && (
                <p
                  className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30 transition-all"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-medium text-zinc-200 underline underline-offset-4 hover:text-white transition-colors"
              >
                Log in
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
