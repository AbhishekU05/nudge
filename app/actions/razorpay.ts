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

export async function manageSubscription() {
  redirect("/settings/billing?error=not_supported");
}
