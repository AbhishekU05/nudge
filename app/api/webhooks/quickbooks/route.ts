import { NextResponse } from "next/server";
import crypto from "crypto";
import { inngest } from "@/lib/inngest/client";
import { logger } from "@/lib/logger";

// Intuit expects a fast acknowledgment (its own retry schedule is 20/30/50
// min, but a hung/slow handler still risks platform-level function timeouts
// and endpoint disablement after 3 failed retries). The actual processing
// (QuickBooks API fetch + Postgres upserts, one full round-trip per entity
// notification) happens in the quickbooks-webhook-event Inngest function
// instead of inline here — see lib/inngest/functions/quickbooks-webhook-event.ts
// for the moved processing logic (unchanged from what used to run here).
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("intuit-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const { getQuickBooksMode } = await import("@/lib/platform-settings");
  const mode = await getQuickBooksMode();
  const webhookKey = mode === "sandbox"
    ? process.env.QUICKBOOKS_DEV_WEBHOOK_TOKEN
    : process.env.QUICKBOOKS_WEBHOOK_TOKEN;

  if (!webhookKey) {
    logger.error({ message: `QUICKBOOKS_WEBHOOK_TOKEN (${mode}) is not configured`, context: "quickbooks-webhook" });
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
    const eventNotifications = payload.eventNotifications || [];

    const events: { name: "quickbooks/webhook.event.received"; data: { realmId: string; entity: unknown } }[] = [];
    for (const notification of eventNotifications) {
      const realmId = notification.realmId;
      const dataChangeEvent = notification.dataChangeEvent;
      if (dataChangeEvent && dataChangeEvent.entities) {
        for (const entity of dataChangeEvent.entities) {
          events.push({ name: "quickbooks/webhook.event.received", data: { realmId, entity } });
        }
      }
    }

    if (events.length > 0) {
      await inngest.send(events);
    }
  } catch (err) {
    logger.error({
      message: "Error handing off QuickBooks webhook to Inngest",
      error: err instanceof Error ? err.message : String(err),
      context: "quickbooks-webhook",
    });
    // We failed to even record the event anywhere — ask Intuit to retry the
    // delivery (cheap: it just resends the same small payload, not a re-run
    // of the actual processing).
    return NextResponse.json({ error: "Failed to queue event" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
