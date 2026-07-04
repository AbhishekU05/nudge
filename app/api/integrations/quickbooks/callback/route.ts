import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { completeQuickBooksOAuthCallback } from "@/lib/quickbooks";
import { getAppUrl } from "@/lib/email/reminder";
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
  const realmId = request.nextUrl.searchParams.get("realmId");
  const errorParam = request.nextUrl.searchParams.get("error");

  if (errorParam) {
    logger.external({
      service: "QuickBooks",
      action: "oauth_callback",
      success: false,
      error: errorParam,
    });
    return redirectToSettings("error", `QuickBooks authorization failed: ${errorParam}`);
  }

  if (!code || !state || !realmId) {
    return redirectToSettings("error", "QuickBooks did not return all required parameters.");
  }

  try {
    const result = await completeQuickBooksOAuthCallback(code, realmId, state);
    revalidatePath("/settings/integrations");
    revalidatePath("/dashboard");
    return redirectToSettings(
      "success",
      `QuickBooks connected successfully. ${result.imported} invoices imported, ${result.updated} updated.`,
    );
  } catch (error) {
    logger.external({
      service: "QuickBooks",
      action: "oauth_callback",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return redirectToSettings(
      "error",
      error instanceof Error ? error.message : "Failed to connect QuickBooks.",
    );
  }
}
