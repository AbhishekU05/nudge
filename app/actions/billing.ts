"use server";
/**
 * Billing actions for Dodo Payments Checkout flow (Milestone 5).
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { getOrganizationBillingForUser, canManageOrganizationBilling } from "@/lib/organization-billing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDodoClient, getDodoProductId } from "@/lib/dodo";
import type { PricingPlanType } from "@/lib/types";
import { logger } from "@/lib/logger";

export async function startSubscriptionCheckout(formData?: FormData) {
  try {
    const user = await requireUser();
    const supabaseAdmin = createSupabaseAdminClient();
    const org = await getOrganizationBillingForUser(supabaseAdmin, user.id);

    if (!org) {
      return { error: "No organization found." };
    }

    if (!canManageOrganizationBilling(org.role)) {
      return { error: "Only admins can manage billing." };
    }

    const plan = (formData?.get("plan") as PricingPlanType) || "monthly";
    let productId: string | undefined;
    let dodo;
    let configError = false;
    
    try {
      productId = getDodoProductId(plan);
      dodo = getDodoClient();
    } catch (error) {
      logger.error({ message: "Dodo config error", context: "billing:checkout", error: error instanceof Error ? error.message : "Unknown error" });
      configError = true;
    }

    if (configError || !productId || !dodo) {
      return { error: "Payment gateway not configured." };
    }

    let session;
    let checkoutError = false;
    
    try {
      let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000";
      if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
        baseUrl = `https://${baseUrl}`;
      }
      
      session = await dodo.checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 1 }],
        return_url: `${baseUrl}/settings/billing?success=true`,
        metadata: {
          organization_id: org.id,
          plan_type: plan,
        },
        customer: {
          email: user.email!,
          name: user.user_metadata?.full_name || "Customer",
        }
      });
    } catch (error) {
      logger.error({ 
        message: error instanceof Error ? error.message : "Failed to create checkout session", 
        context: "billing:checkout", 
        organization_id: org.id 
      });
      checkoutError = true;
    }

    if (checkoutError) {
      return { error: "Unable to start checkout. Please try again." };
    }

    if (session && session.checkout_url) {
      return { url: session.checkout_url };
    } else {
      return { error: "Unable to start checkout. Invalid response." };
    }
  } catch (err) {
    console.error("Fatal error in startSubscriptionCheckout:", err);
    return { error: "Server Error: Unable to process checkout." };
  }
}

export async function cancelSubscription() {
  const user = await requireUser();
  const supabaseAdmin = createSupabaseAdminClient();
  const org = await getOrganizationBillingForUser(supabaseAdmin, user.id);

  if (!org) {
    return { error: "No organization found." };
  }
  if (!canManageOrganizationBilling(org.role)) {
    return { error: "Only admins can manage billing." };
  }
  
  if (!org.dodo_subscription_id) {
    return { error: "No active subscription to cancel." };
  }

  let dodo;
  let configError = false;
  try {
    dodo = getDodoClient();
  } catch (error) {
    configError = true;
  }

  if (configError || !dodo) {
    return { error: "Payment gateway not configured." };
  }

  return { error: "Cancellation must be done through customer portal." };
}

export async function manageSubscription() {
  const user = await requireUser();
  const supabaseAdmin = createSupabaseAdminClient();
  const org = await getOrganizationBillingForUser(supabaseAdmin, user.id);

  if (!org) {
    redirect("/settings/billing?error=No+organization+found.");
  }
  
  if (!org.dodo_customer_id) {
    redirect("/settings/billing?error=No+billing+history+found.");
  }

  let dodo;
  let configError = false;
  try {
    dodo = getDodoClient();
  } catch (error) {
    configError = true;
  }

  if (configError || !dodo) {
    redirect("/settings/billing?error=Payment+gateway+not+configured.");
  }

  redirect("/settings/billing?error=Customer+portal+not+yet+supported.");
}

export async function joinWaitlist() {
  revalidatePath("/settings/billing");
  redirect("/settings/billing?success=You've been added to the waitlist!");
}
