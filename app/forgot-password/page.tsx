/*
 * forgot password page
 */
import Link from "next/link";

import { requestPasswordReset } from "@/app/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// main function for the page
export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we'll send you a link."
    >
      <form action={requestPasswordReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>
        {success ? (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {success}
          </p>
        ) : null}
        {error ? (
          <p
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full">
          Send reset link
        </Button>
      </form>

      {/* uh wtf is this shit*/}
      {/* TODO: figure out what this is and remove it if unnecessary */}
      <div className="mt-6 text-center text-sm text-zinc-500">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-100 underline underline-offset-4 hover:text-white"
        >
          Log in
        </Link>
      </div>
    </AuthShell>
  );
}
