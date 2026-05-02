import { NextResponse } from "next/server";
import crypto from "crypto";

import { getRequiredEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySignature(body: string, signature: string | null) {
  if (!signature) return false;

  const secret = getRequiredEnv("RAZORPAY_WEBHOOK_SECRET");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expected === signature;
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifySignature(body, signature)) {
    logger.error({
      message: "Invalid razorpay signature",
      context: "razorpay:webhook",
      request_id: requestId,
    });
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  type RazorpayEvent = {
    event: string;
    payload: any;
  };

  let event: RazorpayEvent;

  try {
    event = JSON.parse(body);
  } catch {
    logger.error({
      message: "Invalid JSON in webhook body",
      context: "razorpay:webhook",
      request_id: requestId,
    });
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  logger.payment({
    event_type: event.event,
    status: "received",
    request_id: requestId,
  });

  const supabase = createSupabaseAdminClient();

  try {
    if (event.event === "subscription.activated") {
      const sub = event.payload.subscription.entity;
      const userId = sub.notes?.user_id;

      if (!userId) {
        return NextResponse.json({ ok: true, skipped: true });
      }

      await supabase.from("profiles").upsert({
        user_id: userId,
        razorpay_subscription_id: sub.id,
        razorpay_subscription_status: "active",
        razorpay_renews_at: sub.current_end
          ? new Date(sub.current_end * 1000).toISOString()
          : null,
      });
    }

    if (event.event === "subscription.charged") {
      const sub = event.payload.subscription.entity;
      const userId = sub.notes?.user_id;

      if (!userId) {
        return NextResponse.json({ ok: true, skipped: true });
      }

      await supabase.from("profiles").upsert({
        user_id: userId,
        razorpay_subscription_status: "active",
        razorpay_renews_at: sub.current_end
          ? new Date(sub.current_end * 1000).toISOString()
          : null,
      });
    }

    if (event.event === "subscription.cancelled" || event.event === "subscription.halted") {
      const sub = event.payload.subscription.entity;
      const userId = sub.notes?.user_id;

      if (!userId) {
        return NextResponse.json({ ok: true, skipped: true });
      }

      await supabase.from("profiles").upsert({
        user_id: userId,
        razorpay_subscription_status: "cancelled",
      });

      // Pause active nudges since the subscription is gone
      await supabase.from("reminders").update({ active: false }).eq("user_id", userId).eq("active", true);
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const userId = payment.notes?.user_id;

      if (!userId) {
        return NextResponse.json({ ok: true, skipped: true });
      }

      await supabase.from("profiles").upsert({
        user_id: userId,
        razorpay_subscription_status: "past_due",
      });

      // Pause active nudges due to payment failure
      await supabase.from("reminders").update({ active: false }).eq("user_id", userId).eq("active", true);
    }

    logger.payment({
      event_type: event.event,
      status: "processed",
      request_id: requestId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({
      message: "Webhook processing failed",
      context: "razorpay:webhook",
      request_id: requestId,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
