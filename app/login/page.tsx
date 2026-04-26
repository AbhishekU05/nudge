import Link from "next/link";

import { login } from "@/app/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildPathWithQuery, getSafeNextPath } from "@/lib/paths";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; success?: string }>;
}) {
  const { error, next, success } = await searchParams;
  const nextPath = getSafeNextPath(next, "/dashboard");
  const signupHref = buildPathWithQuery("/signup", {
    next: nextPath !== "/dashboard" ? nextPath : null,
  });

  return (
    <AuthShell
      title="Welcome back"
      description="Log in to manage your reminders."
    >
      <form action={login} className="space-y-4">
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
          <Input id="password" name="password" type="password" required />
        </div>
        {success ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}
        {error ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full">
          Log in
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-600">
        No account?{" "}
        <Link
          href={signupHref}
          className="font-medium text-zinc-900 underline underline-offset-4"
        >
          Sign up
        </Link>
      </div>
    </AuthShell>
  );
}
