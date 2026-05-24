/*
 * Supabase auth requests and validation
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getEmailLinkErrorMessage } from "@/lib/auth-errors";
import { buildPathWithQuery, getSafeNextPath } from "@/lib/paths";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// decide where to send user if auth fails
function getAuthErrorRedirectPath(message: string, nextPath: string) {
  if (nextPath === "/reset-password") {
    return buildPathWithQuery("/forgot-password", {
      error: getEmailLinkErrorMessage(message),
    });
  }

  return buildPathWithQuery("/login", {
    error: message,
    next: nextPath !== "/dashboard" ? nextPath : null,
  });
}

// auth callback endpoint
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = getSafeNextPath(url.searchParams.get("next"));
  const authError = url.searchParams.get("error_description");

  if (authError) {
    return NextResponse.redirect(
      new URL(getAuthErrorRedirectPath(authError, nextPath), url.origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        getAuthErrorRedirectPath("Missing authentication code.", nextPath),
        url.origin,
      ),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(getAuthErrorRedirectPath(error.message, nextPath), url.origin),
    );
  }

  const cookieStore = await cookies();
  const referralSource = cookieStore.get("nudge_referral")?.value;

  if (referralSource && data.user) {
    const adminSupabase = createSupabaseAdminClient();
    await adminSupabase
      .from("profiles")
      .update({ referral_source: referralSource })
      .eq("user_id", data.user.id)
      .is("referral_source", null);
  }

  // Store Google OAuth tokens for Gmail API access
  if (data.session && data.user) {
    const providerToken = data.session.provider_token;
    const providerRefreshToken = data.session.provider_refresh_token;

    if (providerToken) {
      const adminSupabase = createSupabaseAdminClient();
      const tokenUpdate: Record<string, string> = {
        google_access_token: providerToken,
      };
      if (providerRefreshToken) {
        tokenUpdate.google_refresh_token = providerRefreshToken;
      }
      await adminSupabase
        .from("profiles")
        .update(tokenUpdate)
        .eq("user_id", data.user.id);
    }
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
