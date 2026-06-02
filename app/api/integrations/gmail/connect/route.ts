import crypto from "crypto";
import { NextResponse } from "next/server";

import { getRequiredEnv } from "@/lib/env";
import { getAppUrl } from "@/lib/email/reminder";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToSettings(key: "error" | "success", message: string) {
  const url = new URL("/settings/integrations", getAppUrl());
  url.searchParams.set(key, message);
  return NextResponse.redirect(url);
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = new URL("/login", getAppUrl());
    url.searchParams.set("next", "/settings/integrations");
    return NextResponse.redirect(url);
  }

  try {
    const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
    const appUrl = getAppUrl();
    const redirectUri = `${appUrl}/api/integrations/gmail/callback`;

    // Generate a state token and persist it so the callback can verify it
    const state = crypto.randomBytes(32).toString("hex");
    const adminSupabase = createSupabaseAdminClient();
    await adminSupabase
      .from("profiles")
      .update({ gmail_oauth_state: state })
      .eq("user_id", user.id);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/gmail.send",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    const consentUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return NextResponse.redirect(consentUrl);
  } catch (error) {
    return redirectToSettings(
      "error",
      error instanceof Error ? error.message : "Unable to start Gmail connection.",
    );
  }
}
