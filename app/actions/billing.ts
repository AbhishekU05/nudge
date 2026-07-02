"use server";
/**
 * Billing actions stub — Milestone 5 (Dodo Payments) will implement the full
 * checkout flow. These stubs exist to keep the billing page compiling until then.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function startSubscriptionCheckout() {
  redirect("/settings/billing/waitlist");
}

export async function cancelSubscription() {
  redirect("/settings/billing?error=Cancellation+not+yet+available.+Coming+soon.");
}

export async function manageSubscription() {
  redirect("/settings/billing?error=not_supported");
}

export async function joinWaitlist() {
  revalidatePath("/settings/billing");
  redirect("/settings/billing?success=You've been added to the waitlist!");
}
