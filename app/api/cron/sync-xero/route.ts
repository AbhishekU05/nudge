import crypto from "crypto";
import { NextResponse } from "next/server";

import { getRequiredEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncXeroInvoicesForUser } from "@/lib/xero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IntegrationUser = {
  user_id: string;
};

function isAuthorized(request: Request) {
  const expected = getRequiredEnv("CRON_SECRET");
  const header = request.headers.get("authorization") || "";
  const key = new URL(request.url).searchParams.get("key") || "";

  const expectedHeaderBuf = Buffer.from(`Bearer ${expected}`);
  const headerBuf = Buffer.from(header);

  if (headerBuf.length === expectedHeaderBuf.length && crypto.timingSafeEqual(headerBuf, expectedHeaderBuf)) {
    return true;
  }

  const expectedKeyBuf = Buffer.from(expected);
  const keyBuf = Buffer.from(key);

  if (keyBuf.length === expectedKeyBuf.length && crypto.timingSafeEqual(keyBuf, expectedKeyBuf)) {
    return true;
  }

  return false;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("user_id")
    .eq("provider", "xero")
    .returns<IntegrationUser[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let success = 0;
  let failed = 0;

  for (const integration of data ?? []) {
    try {
      await syncXeroInvoicesForUser(integration.user_id);
      success += 1;
    } catch (syncError) {
      failed += 1;
      logger.error({
        message: "Scheduled Xero sync failed",
        context: "cron:sync_xero",
        request_id: requestId,
        user_id: integration.user_id,
        error: syncError instanceof Error ? syncError.message : "Unknown error",
      });
    }
  }

  logger.cron({
    job_name: "sync_xero",
    status: failed > 0 ? "error" : "end",
    processed: data?.length ?? 0,
    success_count: success,
    failure_count: failed,
    request_id: requestId,
  });

  return NextResponse.json({
    ok: failed === 0,
    processed: data?.length ?? 0,
    success,
    failed,
  });
}

export async function GET(request: Request) {
  return POST(request);
}
