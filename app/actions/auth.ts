"use server";

import { redirect } from "next/navigation";

import { getRequiredEnv } from "@/lib/env";
import { buildPathWithQuery, getSafeNextPath } from "@/lib/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing field: ${key}`);
  }
  return value.trim();
}

function getOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getNextPath(formData: FormData) {
  return getSafeNextPath(getOptionalString(formData, "next"));
}

function getAuthCallbackUrl(nextPath: string) {
  const appUrl = getRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
  const callbackUrl = new URL("/auth/callback", appUrl);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function signup(formData: FormData) {
  const nextPath = getNextPath(formData);
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirm_password");

  if (password !== confirmPassword) {
    redirect(
      buildPathWithQuery("/signup", {
        error: "Passwords do not match.",
        next: nextPath !== "/dashboard" ? nextPath : null,
      }),
    );
  }

  if (!validateEmail(email)) {
    redirect(
      buildPathWithQuery("/signup", {
        error: "Enter a valid email address.",
        next: nextPath !== "/dashboard" ? nextPath : null,
      }),
    );
  }

  if (password.length < 8) {
    redirect(
      buildPathWithQuery("/signup", {
        error: "Use at least 8 characters for your password.",
        next: nextPath !== "/dashboard" ? nextPath : null,
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(nextPath),
    },
  });

  if (error) {
    redirect(
      buildPathWithQuery("/signup", {
        error: error.message,
        next: nextPath !== "/dashboard" ? nextPath : null,
      }),
    );
  }

  if (data.session) {
    redirect(nextPath);
  }

  redirect(
    buildPathWithQuery("/login", {
      success: "Check your email to confirm your account.",
      next: nextPath !== "/dashboard" ? nextPath : null,
    }),
  );
}

export async function login(formData: FormData) {
  const nextPath = getNextPath(formData);
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");

  if (!validateEmail(email)) {
    redirect(
      buildPathWithQuery("/login", {
        error: "Enter a valid email address.",
        next: nextPath !== "/dashboard" ? nextPath : null,
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    let errorMessage = error.message;
    if (errorMessage.toLowerCase().includes("invalid login credentials")) {
      errorMessage = "Invalid email or password. If you don't have an account, please sign up.";
    }
    redirect(
      buildPathWithQuery("/login", {
        error: errorMessage,
        next: nextPath !== "/dashboard" ? nextPath : null,
      }),
    );
  }

  redirect(nextPath);
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithGoogle(formData: FormData) {
  const nextPath = getNextPath(formData);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(nextPath),
    },
  });

  if (error) {
    redirect(
      buildPathWithQuery("/login", {
        error: error.message,
        next: nextPath !== "/dashboard" ? nextPath : null,
      }),
    );
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function requestPasswordReset(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();
  
  if (!validateEmail(email)) {
    redirect("/forgot-password?error=Enter+a+valid+email+address.");
  }

  const supabase = await createSupabaseServerClient();
  const appUrl = getRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/forgot-password?success=Check+your+email+for+a+password+reset+link.");
}

export async function resetPassword(formData: FormData) {
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirm_password");

  if (password.length < 8) {
    redirect("/reset-password?error=Use+at+least+8+characters+for+your+password.");
  }

  if (password !== confirmPassword) {
    redirect("/reset-password?error=Passwords+do+not+match.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?success=Password+updated+successfully.+You+can+now+log+in.");
}
