import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequiredEnv } from "@/lib/env";
import { getStripeConnectCallbackUrl } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectWithMessage(path: string, key: "error" | "success", message: string) {
  const url = new URL(path, getRequiredEnv("NEXT_PUBLIC_APP_URL"));
  url.searchParams.set(key, message);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");
  const oauthErrorDescription = requestUrl.searchParams.get("error_description");

  if (oauthError) {
    return redirectWithMessage(
      "/dashboard",
      "error",
      oauthErrorDescription ?? oauthError,
    );
  }

  if (!code) {
    return redirectWithMessage("/dashboard", "error", "Missing Stripe authorization code.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithMessage("/login", "error", "Sign in before connecting Stripe.");
  }

  const tokenResponse = await fetch("https://connect.stripe.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_secret: getRequiredEnv("STRIPE_SECRET_KEY"),
      code,
      grant_type: "authorization_code",
      redirect_uri: getStripeConnectCallbackUrl(),
    }),
  });

  const payload = (await tokenResponse.json()) as
    | {
        access_token?: string;
        stripe_user_id?: string;
        error?: string;
        error_description?: string;
      }
    | undefined;

  if (!tokenResponse.ok || !payload?.access_token || !payload.stripe_user_id) {
    return redirectWithMessage(
      "/dashboard",
      "error",
      payload?.error_description ?? payload?.error ?? "Unable to connect Stripe.",
    );
  }

  const { error } = await supabase
    .from("stripe_connections")
    .upsert(
      {
        user_id: user.id,
        stripe_account_id: payload.stripe_user_id,
        access_token: payload.access_token,
      },
      { onConflict: "user_id" },
    );

  if (error) {
    return redirectWithMessage("/dashboard", "error", "Unable to save Stripe connection.");
  }

  return redirectWithMessage("/dashboard", "success", "Stripe connected.");
}
