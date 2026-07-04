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
    error: getEmailLinkErrorMessage(message),
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
        getAuthErrorRedirectPath("Something went wrong. Please try again.", nextPath),
        url.origin,
      ),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(getAuthErrorRedirectPath("Something went wrong. Please try again.", nextPath), url.origin),
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


  return NextResponse.redirect(new URL(nextPath, url.origin));
}
