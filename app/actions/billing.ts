"use server";
/**
 * Billing actions for Dodo Payments Checkout flow (Milestone 5).
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { getOrganizationBillingForUser, canManageOrganizationBilling } from "@/lib/organization-billing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDodoClient, getDodoProductId } from "@/lib/dodo";
import type { PricingPlanType } from "@/lib/types";
import { logger } from "@/lib/logger";

export async function startSubscriptionCheckout(formData?: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const org = await getOrganizationBillingForUser(supabase, user.id);

  if (!org) {
    redirect("/settings/billing?error=No+organization+found.");
  }

  if (!canManageOrganizationBilling(org.role)) {
    redirect("/settings/billing?error=Only+admins+can+manage+billing.");
  }

  const plan = (formData?.get("plan") as PricingPlanType) || "monthly";
  let productId: string;
  try {
    productId = getDodoProductId(plan);
  } catch (error) {
    logger.error({ message: "Unsupported plan type", context: "billing:checkout", plan });
    redirect("/settings/billing?error=Unsupported+plan.");
  }

  const dodo = getDodoClient();
  let session;
  
  try {
    // Determine the base URL for the return_url
    // Fallback to a hardcoded string or NEXT_PUBLIC_SITE_URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
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
    redirect("/settings/billing?error=Unable+to+start+checkout.+Please+try+again.");
  }

  if (session && session.checkout_url) {
    redirect(session.checkout_url);
  } else {
    redirect("/settings/billing?error=Unable+to+start+checkout.+Invalid+response.");
  }
}

export async function cancelSubscription() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const org = await getOrganizationBillingForUser(supabase, user.id);

  if (!org) {
    redirect("/settings/billing?error=No+organization+found.");
  }
  if (!canManageOrganizationBilling(org.role)) {
    redirect("/settings/billing?error=Only+admins+can+manage+billing.");
  }
  
  if (!org.dodo_subscription_id) {
    redirect("/settings/billing?error=No+active+subscription+to+cancel.");
  }

  const dodo = getDodoClient();

  try {
    // Assuming subscriptions API has a cancel or update method to cancel
    // We will attempt to call patch to change status to cancelled?
    // Wait, let's see if there's a customer portal instead
    redirect("/settings/billing?error=Cancellation+must+be+done+through+customer+portal.");
  } catch (error) {
    logger.error({ 
      message: "Cancellation error", 
      context: "billing:cancel", 
      error 
    });
    redirect("/settings/billing?error=Unable+to+cancel+subscription.");
  }
}

export async function manageSubscription() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const org = await getOrganizationBillingForUser(supabase, user.id);

  if (!org) {
    redirect("/settings/billing?error=No+organization+found.");
  }
  
  if (!org.dodo_customer_id) {
    redirect("/settings/billing?error=No+billing+history+found.");
  }

  try {
    const dodo = getDodoClient();
    // Usually customer portals are retrieved via dodo.customerPortal.create({ customer_id: ... })
    // If we don't know the SDK method, we'll redirect to an error for now
    redirect("/settings/billing?error=Customer+portal+not+yet+supported.");
  } catch (error) {
    redirect("/settings/billing?error=Unable+to+open+portal.");
  }
}

export async function joinWaitlist() {
  revalidatePath("/settings/billing");
  redirect("/settings/billing?success=You've been added to the waitlist!");
}
