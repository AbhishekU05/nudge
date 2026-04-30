/*
 * Works with the lemon squeezy api
 *
 */
import { NextResponse } from "next/server";

import crypto from "crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequiredEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Validate that the webhook request came from lemon squeezy
function verifySignature(rawBody: string, signatureHeader: string | null) {
  if (!signatureHeader) return false;
  const secret = getRequiredEnv("LEMON_SQUEEZY_WEBHOOK_SECRET");

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

type LemonWebhookPayload = {
  meta?: { event_name?: string };
  data?: {
    id?: string;
    type?: string;
    attributes?: {
      status?: string;
      renews_at?: string | null;
      customer_id?: number | string | null;
      custom_data?: {
        user_id?: string;
      };
    };
  };
};

// webhook handler
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: LemonWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name ?? "unknown";

  // We only care about subscription lifecycle events.
  if (!payload.data || payload.data.type !== "subscriptions") {
    return NextResponse.json({ received: true, ignored: true, eventName });
  }

  const subscriptionId = payload.data.id ?? null;
  const status = payload.data.attributes?.status ?? null;
  const renewsAt = payload.data.attributes?.renews_at ?? null;
  const customerIdRaw = payload.data.attributes?.customer_id ?? null;
  const customerId = customerIdRaw != null ? String(customerIdRaw) : null;
  let userId = payload.data.attributes?.custom_data?.user_id ?? null;

  const supabase = createSupabaseAdminClient();

  if (!userId && subscriptionId) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("lemon_subscription_id", subscriptionId)
      .maybeSingle<{ user_id: string }>();

    userId = existingProfile?.user_id ?? null;
  }

  if (!userId || !subscriptionId) {
    return NextResponse.json(
      { received: true, warning: "Missing user_id or subscription id" },
      { status: 200 },
    );
  }

  const { error } = await supabase.from("profiles").upsert({
    user_id: userId,
    lemon_customer_id: customerId,
    lemon_subscription_id: subscriptionId,
    lemon_subscription_status: status,
    lemon_renews_at: renewsAt,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true, eventName });
}
