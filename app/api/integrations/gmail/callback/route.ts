import { type NextRequest, NextResponse } from "next/server";

import { getRequiredEnv } from "@/lib/env";
import { getAppUrl } from "@/lib/email/reminder";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToSettings(key: "error" | "success", message: string) {
  const url = new URL("/settings/integrations", getAppUrl());
  url.searchParams.set(key, message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");

  if (errorParam) {
    logger.external({
      service: "Gmail",
      action: "oauth_callback",
      success: false,
      error: errorParam,
    });
    return redirectToSettings("error", `Gmail authorization failed: ${errorParam}`);
  }

  if (!code || !state) {
    return redirectToSettings("error", "Gmail did not return all required parameters.");
  }

  // Verify the logged-in user and state token
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = new URL("/login", getAppUrl());
    url.searchParams.set("next", "/settings/integrations");
    return NextResponse.redirect(url);
  }

  const adminSupabase = createSupabaseAdminClient();

  // Verify CSRF state
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("gmail_oauth_state")
    .eq("user_id", user.id)
    .maybeSingle<{ gmail_oauth_state: string | null }>();

  if (!profile?.gmail_oauth_state || profile.gmail_oauth_state !== state) {
    return redirectToSettings("error", "Invalid Gmail OAuth state. Please try again.");
  }

  // Clear the state token immediately
  await adminSupabase
    .from("profiles")
    .update({ gmail_oauth_state: null })
    .eq("user_id", user.id);

  try {
    const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
    const clientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET");
    const appUrl = getAppUrl();
    const redirectUri = `${appUrl}/api/integrations/gmail/callback`;

    // Exchange the authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`Google token exchange failed (${tokenRes.status}): ${text}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;
    const refreshToken: string | undefined = tokenData.refresh_token;

    if (!accessToken) {
      throw new Error("Google did not return an access token.");
    }

    // Fetch the Gmail address associated with this Google account
    const profileRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/profile",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const gmailEmail = profileRes.ok
      ? (await profileRes.json()).emailAddress ?? null
      : null;

    // Store tokens in the profiles table
    const tokenUpdate: Record<string, string | null> = {
      google_access_token: accessToken,
      gmail_connected_email: gmailEmail,
    };
    if (refreshToken) {
      tokenUpdate.google_refresh_token = refreshToken;
    }

    await adminSupabase
      .from("profiles")
      .update(tokenUpdate)
      .eq("user_id", user.id);

    logger.external({
      service: "Gmail",
      action: "oauth_callback",
      success: true,
    });

    return redirectToSettings("success", "Gmail connected successfully.");
  } catch (error) {
    logger.external({
      service: "Gmail",
      action: "oauth_callback",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return redirectToSettings(
      "error",
      error instanceof Error ? error.message : "Failed to connect Gmail.",
    );
  }
}
