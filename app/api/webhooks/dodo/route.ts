import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { getDodoClient, getDodoWebhookKey } from "@/lib/dodo";
import { processDodoWebhookEvent } from "@/lib/dodo-webhooks";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const webhookId = request.headers.get("webhook-id");
  const webhookSignature = request.headers.get("webhook-signature");
  const webhookTimestamp = request.headers.get("webhook-timestamp");

  if (!webhookId || !webhookSignature || !webhookTimestamp) {
    return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
  }

  const body = await request.text();
  let event;

  try {
    event = getDodoClient().webhooks.unwrap(body, {
      headers: {
        "webhook-id": webhookId,
        "webhook-signature": webhookSignature,
        "webhook-timestamp": webhookTimestamp,
      },
      key: getDodoWebhookKey(),
    });
  } catch (error) {
    logger.error({
      message: error instanceof Error ? error.message : "Invalid Dodo webhook signature",
      context: "dodo:webhook:verify",
      request_id: requestId,
    });
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const result = await processDodoWebhookEvent(
      createSupabaseAdminClient(),
      webhookId,
      event,
    );

    logger.payment({
      event_type: event.type,
      status: result.duplicate ? "duplicate" : "processed",
      request_id: requestId,
      organization_id: result.organizationId ?? undefined,
    });

    return NextResponse.json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    logger.error({
      message: error instanceof Error ? error.message : "Dodo webhook processing failed",
      context: "dodo:webhook:process",
      request_id: requestId,
      event_type: event.type,
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
