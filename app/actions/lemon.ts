"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getRequiredEnv } from "@/lib/env";
import { buildPathWithQuery } from "@/lib/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createHostedCheckout, getSubscription } from "@/lib/lemon";

export async function startSubscriptionCheckout() {
  const user = await requireUser();
  const appUrl = getRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");

  let checkoutUrl: string;

  try {
    checkoutUrl = await createHostedCheckout({
      userId: user.id,
      email: user.email ?? null,
      successUrl: `${appUrl}/settings/billing?success=1`,
      cancelUrl: `${appUrl}/settings/billing?canceled=1`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start checkout.";
    redirect(buildPathWithQuery("/settings/billing", { error: message }));
  }

  // Ensure profile exists (trigger should handle, but safe).
  const supabase = await createSupabaseServerClient();
  await supabase.from("profiles").upsert({ user_id: user.id });

  redirect(checkoutUrl);
}

export async function manageSubscription() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("lemon_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle<{ lemon_subscription_id: string | null }>();

  const subscriptionId = profile?.lemon_subscription_id;
  if (!subscriptionId) {
    redirect("/settings/billing?error=no_subscription");
  }

  let sub: Awaited<ReturnType<typeof getSubscription>>;

  try {
    sub = await getSubscription(subscriptionId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to open billing portal.";
    redirect(buildPathWithQuery("/settings/billing", { error: message }));
  }

  const portalUrl = sub.data.attributes.urls?.customer_portal;
  if (!portalUrl) {
    redirect("/settings/billing?error=no_portal_url");
  }

  redirect(portalUrl);
}
