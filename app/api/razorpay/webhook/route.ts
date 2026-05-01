import { NextResponse } from "next/server";
import crypto from "crypto";
import { getRequiredEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const expected = crypto
    .createHmac("sha256", getRequiredEnv("RAZORPAY_WEBHOOK_SECRET"))
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "payment.captured") {
    const userId = event.payload.payment.entity.notes?.user_id;

    const supabase = createSupabaseAdminClient();

    await supabase.from("profiles").upsert({
      user_id: userId,
      lemon_subscription_status: "active", // reuse column for now
    });
  }

  return NextResponse.json({ ok: true });
}
