import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";

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

  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);

  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

const RazorpayEventSchema = z.object({
  event: z.string(),
  payload: z.object({
    subscription: z.object({
      entity: z.object({
        id: z.string(),
        status: z.string().optional(),
        current_end: z.number().optional(),
        notes: z.object({
          user_id: z.string().optional(),
        }).optional(),
      }).optional(),
    }).optional(),
    payment: z.object({
      entity: z.object({
        notes: z.object({
          user_id: z.string().optional(),
        }).optional(),
      }).optional(),
    }).optional(),
  }),
});

type RazorpayEvent = z.infer<typeof RazorpayEventSchema>;

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

  let event: RazorpayEvent;

  try {
    const rawData = JSON.parse(body);
    event = RazorpayEventSchema.parse(rawData);
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
    if (
      event.event === "subscription.activated" ||
      event.event === "subscription.charged" ||
      event.event === "payment.captured"
    ) {
      const sub = event.payload.subscription?.entity;

      if (!sub) {
        return NextResponse.json({ ok: true, skipped: true });
      }

      const userId = sub.notes?.user_id;

      logger.payment({
        message: "Processing webhook event",
        status: "processing",
        event_type: event.event,
        user_id: userId || "missing",
        subscription_id: sub.id,
        subscription_status: sub.status,
      });

      if (!userId) {
        logger.error({
          message: "Missing user_id in subscription notes",
          context: "razorpay:webhook",
          request_id: requestId,
          subscription_id: sub.id,
        });
        return NextResponse.json({ ok: true, skipped: true });
      }

      await supabase
        .from("profiles")
        .update({
          razorpay_subscription_id: sub.id,
          razorpay_subscription_status: "active",
          razorpay_renews_at: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null,
        })
        .eq("user_id", userId);
    }

    if (event.event === "subscription.cancelled" || event.event === "subscription.halted") {
      const sub = event.payload.subscription?.entity;

      if (!sub) {
        return NextResponse.json({ ok: true, skipped: true });
      }

      const userId = sub.notes?.user_id;

      if (!userId) {
        return NextResponse.json({ ok: true, skipped: true });
      }

      await supabase
        .from("profiles")
        .update({
          razorpay_subscription_status: "cancelled",
        })
        .eq("user_id", userId);

      // Pause active reminders since the subscription is gone
      await supabase.from("invoices").update({ active: false }).eq("user_id", userId).eq("active", true);
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment?.entity;

      if (!payment) {
        return NextResponse.json({ ok: true, skipped: true });
      }

      const userId = payment.notes?.user_id;

      if (!userId) {
        return NextResponse.json({ ok: true, skipped: true });
      }

      await supabase
        .from("profiles")
        .update({
          razorpay_subscription_status: "past_due",
        })
        .eq("user_id", userId);

      // Pause active reminders due to payment failure
      await supabase.from("invoices").update({ active: false }).eq("user_id", userId).eq("active", true);
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
