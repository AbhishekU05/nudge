"use server";

import { redirect } from "next/navigation";
import Razorpay from "razorpay";

import { requireUser } from "@/lib/auth";
import { getRequiredEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function startSubscriptionCheckout() {
  const user = await requireUser();

  const keyId = getRequiredEnv("RAZORPAY_KEY_ID");
  const keySecret = getRequiredEnv("RAZORPAY_KEY_SECRET");
  const planId = getRequiredEnv("RAZORPAY_PLAN_ID");

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const startTime = Date.now();
  let subscription;
  try {
    subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 120, // 10 years, effectively "until canceled"
      customer_notify: 1,
      notes: {
        user_id: user.id,
      },
    });
    
    logger.external({
      service: "Razorpay",
      action: "create_subscription",
      success: true,
      latency: Date.now() - startTime,
      user_id: user.id,
    });
  } catch (err) {
    logger.external({
      service: "Razorpay",
      action: "create_subscription",
      success: false,
      latency: Date.now() - startTime,
      error: err instanceof Error ? err.message : "Unknown error",
      user_id: user.id,
    });
    throw err;
  }

  redirect(`/checkout?subscriptionId=${subscription.id}`);
}

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function cancelSubscription() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("razorpay_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.razorpay_subscription_id) {
    redirect("/settings/billing?error=no_subscription");
  }

  const keyId = getRequiredEnv("RAZORPAY_KEY_ID");
  const keySecret = getRequiredEnv("RAZORPAY_KEY_SECRET");

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const startTime = Date.now();
  try {
    // cancel_at_cycle_end = false (0) -> cancel immediately
    await razorpay.subscriptions.cancel(profile.razorpay_subscription_id, false);
    
    logger.external({
      service: "Razorpay",
      action: "cancel_subscription",
      success: true,
      latency: Date.now() - startTime,
      user_id: user.id,
    });

    // Optimistically update the database
    await supabase
      .from("profiles")
      .update({ razorpay_subscription_status: "cancelled" })
      .eq("user_id", user.id);
  } catch (error) {
    logger.external({
      service: "Razorpay",
      action: "cancel_subscription",
      success: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
      user_id: user.id,
    });
    logger.error({
      message: "Cancellation failed",
      context: "cancelSubscription",
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    redirect("/settings/billing?error=cancellation_failed");
  }

  redirect("/settings/billing?success=Subscription cancelled successfully");
}

export async function manageSubscription() {
  redirect("/settings/billing?error=not_supported");
}
