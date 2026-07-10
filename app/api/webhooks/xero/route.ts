import { NextResponse } from "next/server";
import crypto from "crypto";
import { inngest } from "@/lib/inngest/client";
import { logger } from "@/lib/logger";

// Xero requires a 200 response within 5 seconds. The actual processing
// (Xero API fetch + Postgres upserts, one full round-trip per event in the
// batch) happens in the xero-webhook-event Inngest function instead of
// inline here, so this handler's only job is: verify the signature, hand
// each event off to Inngest, and ack. See lib/inngest/functions/xero-webhook-event.ts
// for the moved processing logic (unchanged from what used to run here).
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-xero-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const webhookKey = process.env.XERO_WEBHOOK_KEY;
  if (!webhookKey) {
    logger.error({ message: "XERO_WEBHOOK_KEY is not configured", context: "xero-webhook" });
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  const computedSignature = crypto
    .createHmac("sha256", webhookKey)
    .update(rawBody)
    .digest("base64");

  if (computedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const events = payload.events || [];

    if (events.length > 0) {
      await inngest.send(
        events.map((event: unknown) => ({
          name: "xero/webhook.event.received" as const,
          data: event,
        }))
      );
    }
  } catch (err) {
    logger.error({
      message: "Error handing off Xero webhook to Inngest",
      error: err instanceof Error ? err.message : String(err),
      context: "xero-webhook",
    });
    // We failed to even record the event anywhere — ask Xero to retry the
    // delivery (cheap: it just resends the same small payload, not a re-run
    // of the actual processing).
    return NextResponse.json({ error: "Failed to queue event" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
