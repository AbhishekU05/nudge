import { NextResponse } from "next/server";

import { completeXeroOAuthCallback } from "@/lib/xero";
import { getAppUrl } from "@/lib/email/reminder";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToSettings(key: "error" | "success", message: string) {
  const url = new URL("/settings/integrations", getAppUrl());
  url.searchParams.set(key, message);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const oauthError = requestUrl.searchParams.get("error_description")
    ?? requestUrl.searchParams.get("error");
  const state = requestUrl.searchParams.get("state");

  if (oauthError) {
    return redirectToSettings("error", oauthError);
  }

  if (!state) {
    return redirectToSettings("error", "Missing Xero OAuth state.");
  }

  try {
    const result = await completeXeroOAuthCallback(request.url, state);
    const url = new URL("/settings/integrations/xero/bank", getAppUrl());
    url.searchParams.set("success", `Xero connected. Imported ${result.imported} invoices and updated ${result.updated + result.markedPaid}.`);
    return NextResponse.redirect(url);
  } catch (error) {
    logger.error({
      message: "Xero OAuth callback failed",
      context: "xero:callback",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return redirectToSettings(
      "error",
      error instanceof Error ? error.message : "Unable to connect Xero.",
    );
  }
}
