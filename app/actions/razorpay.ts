"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Razorpay from "razorpay";

import { requireUser } from "@/lib/auth";
import { getRequiredEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  getBillingRegionForCountry,
  getCountryCodeFromHeaders,
} from "@/lib/pricing";

export async function startSubscriptionCheckout() {
  redirect("/settings/billing/waitlist");
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

import { revalidatePath } from "next/cache";

export async function joinWaitlist() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Optimistically update the database
  const renewsAt = new Date();
  renewsAt.setDate(renewsAt.getDate() + 30);
  
  const { error } = await supabase
    .from("profiles")
    .update({ 
      razorpay_subscription_status: "waitlist",
      razorpay_renews_at: renewsAt.toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    logger.error({
      message: "Failed to join waitlist",
      context: "joinWaitlist",
      user_id: user.id,
      error: error.message,
    });
    redirect("/settings/billing?error=waitlist_failed");
  }

  logger.action({
    action_name: "join_waitlist",
    user_id: user.id,
    success: true,
  });

  revalidatePath("/settings/billing");
  revalidatePath("/invoices");

  redirect("/settings/billing?success=You've been added to the waitlist and granted a 1-month extended trial!");
}
