"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Helper to get the organization_id for the current user.
 * All data access must be scoped to an organization.
 */
async function getOrganizationId(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.organization_id ?? null;
}

export async function createClient(formData: FormData) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);

  if (!organizationId) {
    redirect("/customers/new?error=" + encodeURIComponent("No organization found. Please contact support."));
  }

  const supabase = await createSupabaseServerClient();
  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim() || null;
  const company_name = (formData.get("company_name") as string | null)?.trim() || null;

  if (!name) {
    redirect("/customers/new?error=" + encodeURIComponent("Customer name is required"));
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: organizationId,
      name,
      email: email ?? "",
      company_name,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create client:", error);
    redirect("/customers/new?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/customers");
  redirect(`/customers/${data.id}`);
}
