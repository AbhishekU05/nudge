/*
 * all logic for auth, signup, signin etc
 */
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getEmailLinkErrorMessage } from "@/lib/auth-errors";
import { isGoogleAuthEnabled } from "@/lib/auth-providers";
import { getRequiredEnv } from "@/lib/env";
import { buildPathWithQuery, getSafeNextPath } from "@/lib/paths";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Extracts string from form in website
// TODO: make sure this is csec safe
function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing field: ${key}`);
  }
  return value.trim();
}

// Same as previous function for some reason?? 
function getOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// gets the next redirect safely
// TODO: make sure its actually safe
function getNextPath(formData: FormData) {
  return getSafeNextPath(getOptionalString(formData, "next"));
}

// gets next url based on auth action
// TODO: make sure this one is also safe
function getAuthCallbackUrl(nextPath: string) {
  const appUrl = getRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
  const callbackUrl = new URL("/auth/callback", appUrl);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

// basic email format validation
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getSignupErrorPath({
  error,
  nextPath,
  email,
}: {
  error: string;
  nextPath: string;
  email?: string;
}) {
  return buildPathWithQuery("/signup", {
    error,
    email,
    next: nextPath !== "/dashboard" ? nextPath : null,
  });
}

async function isExistingAuthEmail(email: string) {
  const adminSupabase = createSupabaseAdminClient();
  const normalizedEmail = email.toLowerCase();
  const perPage = 1000;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) return false;

    if (
      data.users.some((user) => user.email?.toLowerCase() === normalizedEmail)
    ) {
      return true;
    }

    if (data.users.length < perPage) {
      return false;
    }
  }

  return false;
}

// registers a new user
export async function signup(formData: FormData) {
  const nextPath = getNextPath(formData);
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirm_password");
  const fullName = getString(formData, "full_name");

  // TODO: check this redirect. redirect back to signup?
  if (password !== confirmPassword) {
    redirect(getSignupErrorPath({ error: "Passwords do not match.", nextPath, email }));
  }

  // TODO: why are we redirecting to dashboard here aaaaaaaah
  if (!validateEmail(email)) {
    redirect(getSignupErrorPath({ error: "Enter a valid email address.", nextPath, email }));
  }

  // TODO: again?? why the dashboard
  if (password.length < 8) {
    redirect(getSignupErrorPath({ error: "Use at least 8 characters for your password.", nextPath, email }));
  }

  if (await isExistingAuthEmail(email)) {
    redirect(
      getSignupErrorPath({
        error: "An account with this email already exists. Log in instead.",
        nextPath,
        email,
      }),
    );
  }

  const cookieStore = await cookies();
  const referralSource = cookieStore.get("nudge_referral")?.value;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(nextPath),
      data: {
        full_name: fullName,
        referral_source: referralSource || null,
      },
    },
  });

  // TODO: bruhh just fix the redirect
  if (error) {
    redirect(getSignupErrorPath({ error: error.message, nextPath, email }));
  }

  if (data.user?.identities && data.user.identities.length === 0) {
    redirect(
      getSignupErrorPath({
        error: "An account with this email already exists. Log in instead.",
        nextPath,
        email,
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

// logs a user in
export async function login(formData: FormData) {
  const nextPath = getNextPath(formData);
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");

  // TODO: fix redirect 
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
    // TODO: fix redirects
    redirect(
      buildPathWithQuery("/login", {
        error: errorMessage,
        next: nextPath !== "/dashboard" ? nextPath : null,
      }),
    );
  }

  redirect(nextPath);
}

// logs out user
export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateProfileName(formData: FormData) {
  const fullName = getString(formData, "full_name");

  if (fullName.length > 100) {
    redirect("/dashboard?error=Profile+name+is+too+long.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: fullName,
    },
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?success=Profile+updated.");
}

// sign in user through google
// TODO: fix the google auth process
export async function signInWithGoogle(formData: FormData) {
  const nextPath = getNextPath(formData);

  // are we actually gonna display this to the user???
  // TODO: change it up a bit maybe??
  if (!isGoogleAuthEnabled()) {
    redirect(
      buildPathWithQuery("/login", {
        error: "Google sign-in is not enabled for this workspace. Use email and password instead.",
        next: nextPath !== "/dashboard" ? nextPath : null,
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(nextPath),
      scopes: "https://www.googleapis.com/auth/gmail.send",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  // again are we really gonna show this to the user??
  // TODO: change this message up a bit
  if (error) {
    const errorMessage = error.message
      .toLowerCase()
      .includes("provider is not enabled")
      ? "Google sign-in is not enabled for this workspace. Use email and password instead."
      : error.message;

      // TODO: what is this redirect aaaaah
    redirect(
      buildPathWithQuery("/login", {
        error: errorMessage,
        next: nextPath !== "/dashboard" ? nextPath : null,
      }),
    );
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect(
    buildPathWithQuery("/login", {
      error: "Google sign-in did not return a login URL. Please try again.",
      next: nextPath !== "/dashboard" ? nextPath : null,
    }),
  );
}

export async function requestPasswordReset(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();
  
  if (!validateEmail(email)) {
    redirect("/forgot-password?error=Enter+a+valid+email+address.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthCallbackUrl("/reset-password"),
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(getEmailLinkErrorMessage())}`,
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        getEmailLinkErrorMessage(error.message),
      )}`,
    );
  }

  await supabase.auth.signOut();
  redirect("/login?success=Password+updated+successfully.+You+can+now+log+in.");
}
