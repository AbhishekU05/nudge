"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createClient(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("razorpay_subscription_status, created_at")
    .eq("user_id", user.id)
    .single();

  const hasSubscription = hasActiveSubscription(
    profile?.razorpay_subscription_status ?? null,
    profile?.created_at
  );

  if (!hasSubscription) {
    redirect("/settings/billing");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!name) {
    redirect("/customers/new?error=" + encodeURIComponent("Customer name is required"));
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      name,
      email: email || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create customer:", error);
    redirect("/customers/new?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/customers");
  redirect(`/customers/${data.id}`);
}
