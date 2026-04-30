/*
 * Supabase auth requests and validation
 */
import { NextResponse } from "next/server";

import { getEmailLinkErrorMessage } from "@/lib/auth-errors";
import { buildPathWithQuery, getSafeNextPath } from "@/lib/paths";
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
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(getAuthErrorRedirectPath(error.message, nextPath), url.origin),
    );
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
