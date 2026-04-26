import Link from "next/link";

import { signup } from "@/app/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildPathWithQuery, getSafeNextPath } from "@/lib/paths";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const nextPath = getSafeNextPath(next, "/dashboard");
  const loginHref = buildPathWithQuery("/login", {
    next: nextPath !== "/dashboard" ? nextPath : null,
  });

  return (
    <AuthShell
      title="Create your account"
      description="Start nudging with calm, recurring reminders."
    >
      <form action={signup} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
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
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
          />
          <p className="text-xs text-zinc-500">Use at least 8 characters.</p>
        </div>
        {error ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full">
          Sign up
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-medium text-zinc-900 underline underline-offset-4"
        >
          Log in
        </Link>
      </div>
    </AuthShell>
  );
}
