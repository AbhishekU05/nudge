import Link from "next/link";

import { signup } from "@/app/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { GoogleAuthButton } from "@/components/site/google-auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isGoogleAuthEnabled } from "@/lib/auth-providers";
import { buildPathWithQuery, getSafeNextPath } from "@/lib/paths";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; next?: string }>;
}) {
  const { email, error, next } = await searchParams;
  const nextPath = getSafeNextPath(next, "/dashboard");
  const initialEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const loginHref = buildPathWithQuery("/login", {
    next: nextPath !== "/dashboard" ? nextPath : null,
  });
  const googleAuthEnabled = isGoogleAuthEnabled();

  return (
    <AuthShell
      title="Create your account."
      description="Start tracking invoices and getting paid on time."
    >
      <form action={signup} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            placeholder="e.g., Alex Rivera"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="e.g., alex@agency.com"
            defaultValue={initialEmail}
            required
          />
          <p className="text-xs text-zinc-500">Use your work email to automatically join your company&apos;s workspace.</p>
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
          <p className="text-xs text-zinc-500">At least 8 characters</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm Password</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            minLength={8}
            required
          />
        </div>
        {error ? (
          <p
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full">
          Create account
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
            <GoogleAuthButton nextPath={nextPath}>Sign up with Google</GoogleAuthButton>
          </div>
        </>
      ) : null}

      <div className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-medium text-zinc-100 underline underline-offset-4 hover:text-white"
        >
          Log in
        </Link>
      </div>
    </AuthShell>
  );
}
