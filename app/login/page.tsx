/*
 * login page
 */
import Link from "next/link";

import { login } from "@/app/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { GoogleAuthButton } from "@/components/site/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isGoogleAuthEnabled } from "@/lib/auth-providers";
import { buildPathWithQuery, getSafeNextPath } from "@/lib/paths";

// main function for login page
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
  const googleAuthEnabled = isGoogleAuthEnabled();

  // TODO: fix the wordings
  return (
    <AuthShell
      title="Welcome back."
      description="Let's get you back to your workspace."
    >
      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <div className="space-y-2">
          <Label htmlFor="email">Your email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="e.g., alex@agency.com"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Your password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-zinc-500 underline underline-offset-4 hover:text-zinc-200"
            >
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" required />
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
          Sign in
        </Button>
      </form>

      {googleAuthEnabled ? (
        <>
          <div className="mt-5 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
            <span className="text-xs uppercase tracking-wider text-zinc-500">
              or
            </span>
          </div>

          <div className="mt-4">
            <GoogleAuthButton nextPath={nextPath}>Log in with Google</GoogleAuthButton>
          </div>
        </>
      ) : null}

      <div className="mt-6 text-center text-sm text-zinc-500">
        Don’t have an account?{" "}
        <Link
          href={signupHref}
          className="font-medium text-zinc-100 underline underline-offset-4 hover:text-white"
        >
          Sign up
        </Link>
      </div>
    </AuthShell>
  );
}
