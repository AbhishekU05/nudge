import { NextResponse } from "next/server";

import { buildQuickBooksConsentUrl } from "@/lib/quickbooks";
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

  // Paywall check
  const { data: member } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).single();
  if (member) {
    const { data: org } = await supabase.from("organizations").select("dodo_subscription_status, created_at").eq("id", member.organization_id).single();
    if (org) {
      const { isAutomationAndIntegrationAllowed } = await import("@/lib/payments");
      if (!isAutomationAndIntegrationAllowed(org.dodo_subscription_status, org.created_at)) {
        return redirectToSettings("error", "You must upgrade to a paid subscription to use integrations.");
      }
    }
  }

  try {
    const consentUrl = await buildQuickBooksConsentUrl(user.id);
    return NextResponse.redirect(consentUrl);
  } catch (error) {
    return redirectToSettings(
      "error",
      error instanceof Error ? error.message : "Unable to start QuickBooks connection.",
    );
  }
}
