import { NextResponse } from "next/server";

import { buildXeroConsentUrl } from "@/lib/xero";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/email/reminder";

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
    const consentUrl = await buildXeroConsentUrl(user.id);
    return NextResponse.redirect(consentUrl);
  } catch (error) {
    return redirectToSettings(
      "error",
      error instanceof Error ? error.message : "Unable to start Xero connection.",
    );
  }
}
