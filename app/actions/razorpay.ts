"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRequiredEnv } from "@/lib/env";

export async function startSubscriptionCheckout() {
  const user = await requireUser();

  const keyId = getRequiredEnv("RAZORPAY_KEY_ID");

  // create order from backend (you should move this to API route ideally)
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/razorpay/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
    }),
  });

  const { orderId } = await res.json();

  redirect(`/checkout?orderId=${orderId}&key=${keyId}`);
}

// Razorpay doesn't have portal like Lemon
export async function manageSubscription() {
  redirect("/settings/billing?error=not_supported");
}
