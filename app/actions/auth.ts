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
    redirect(
      buildPathWithQuery("/login", {
        error: error.message,
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
