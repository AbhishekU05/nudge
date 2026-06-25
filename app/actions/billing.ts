"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function startSubscriptionCheckout() {
  redirect("/settings/billing/waitlist");
}

export async function cancelSubscription() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const startTime = Date.now();
  try {
    // Optimistically update the database to cancel without external API calls
    await supabase
      .from("profiles")
      .update({ razorpay_subscription_status: "cancelled" })
      .eq("user_id", user.id);
      
    logger.action({
      action_name: "cancel_subscription",
      success: true,
      user_id: user.id,
    });
  } catch (error) {
    logger.error({
      message: "Cancellation failed",
      context: "cancelSubscription",
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    redirect("/settings/billing?error=cancellation_failed");
  }

  revalidatePath("/settings/billing");
  redirect("/settings/billing?success=Subscription cancelled successfully");
}

export async function manageSubscription() {
  redirect("/settings/billing?error=not_supported");
}

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
