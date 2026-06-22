import { NextResponse } from "next/server";
import { getRequiredEnv } from "@/lib/env";
import { sendWeeklyDigestEmails } from "@/lib/email/send-digest";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${getRequiredEnv("CRON_SECRET")}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendWeeklyDigestEmails();
    if (!result.success) {
      throw result.error;
    }
    
    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    logger.error({ message: "Failed to send digest emails via cron", error: error.message, context: "cron_send_digest" });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
