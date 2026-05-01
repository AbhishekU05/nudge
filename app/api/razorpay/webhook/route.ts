import { NextResponse } from "next/server";
import crypto from "crypto";

import { getRequiredEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifySignature(body, signature)) {
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
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

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
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
