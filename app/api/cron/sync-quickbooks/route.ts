import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";

import { getRequiredEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { syncQuickBooksInvoicesForUser } from "@/lib/quickbooks";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization") || "";
  const expectedAuth = `Bearer ${getRequiredEnv("CRON_SECRET")}`;

  const authHeaderBuf = Buffer.from(authHeader);
  const expectedAuthBuf = Buffer.from(expectedAuth);

  if (
    authHeaderBuf.length !== expectedAuthBuf.length ||
    !crypto.timingSafeEqual(authHeaderBuf, expectedAuthBuf)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("user_id")
    .eq("provider", "quickbooks");

  if (error) {
    logger.external({
      service: "QuickBooks",
      action: "cron_sync",
      success: false,
      error: error.message,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const integration of integrations || []) {
    try {
      const result = await syncQuickBooksInvoicesForUser(integration.user_id);
      results.push({ userId: integration.user_id, success: true, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({ userId: integration.user_id, success: false, error: message });
      logger.external({
        service: "QuickBooks",
        action: "cron_sync",
        success: false,
        user_id: integration.user_id,
        error: message,
      });
    }
  }

  return NextResponse.json({ results });
}
