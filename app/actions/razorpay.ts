"use server";

import { redirect } from "next/navigation";
import Razorpay from "razorpay";

import { requireUser } from "@/lib/auth";
import { getRequiredEnv } from "@/lib/env";

export async function startSubscriptionCheckout() {
  const user = await requireUser();

  const keyId = getRequiredEnv("RAZORPAY_KEY_ID");
  const keySecret = getRequiredEnv("RAZORPAY_KEY_SECRET");
  const planId = getRequiredEnv("RAZORPAY_PLAN_ID");

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: 120, // 10 years, effectively "until canceled"
    customer_notify: 1,
    notes: {
      user_id: user.id,
    },
  });

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

  try {
    // cancel_at_cycle_end = false (0) -> cancel immediately
    await razorpay.subscriptions.cancel(profile.razorpay_subscription_id, false);
    
    // Optimistically update the database
    await supabase
      .from("profiles")
      .update({ razorpay_subscription_status: "cancelled" })
      .eq("user_id", user.id);
  } catch (error) {
    console.error(error);
    redirect("/settings/billing?error=cancellation_failed");
  }

  redirect("/settings/billing?success=Subscription cancelled successfully");
}

export async function manageSubscription() {
  redirect("/settings/billing?error=not_supported");
}
