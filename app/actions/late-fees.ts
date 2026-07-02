"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getOrganizationId(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.organization_id ?? null;
}

export async function createLateFeePolicy(formData: FormData) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) throw new Error("No organization found.");

  const supabase = await createSupabaseServerClient();

  const name = formData.get("name") as string;
  const fee_type = formData.get("fee_type") as "flat" | "percentage";
  const fee_value = Number(formData.get("fee_value"));
  const grace_period_days = Number(formData.get("grace_period_days"));
  const frequency = formData.get("frequency") as "once" | "weekly" | "monthly";
  const apply_to = formData.get("apply_to") as "existing_invoice" | "new_invoice";
  const excluded_group_ids = formData.getAll("excluded_group_ids") as string[];

  const { error } = await supabase.from("late_fee_policies").insert({
    organization_id: organizationId,
    name,
    fee_type,
    fee_value,
    grace_period_days,
    frequency,
    apply_to,
    excluded_group_ids,
    active: true,
  });

  if (error) {
    console.error("Failed to create late fee policy", error);
    throw new Error("Failed to create late fee policy");
  }

  revalidatePath("/settings/late-fees");
}

export async function updateLateFeePolicy(id: string, formData: FormData) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) throw new Error("No organization found.");

  const supabase = await createSupabaseServerClient();

  const name = formData.get("name") as string;
  const fee_type = formData.get("fee_type") as "flat" | "percentage";
  const fee_value = Number(formData.get("fee_value"));
  const grace_period_days = Number(formData.get("grace_period_days"));
  const frequency = formData.get("frequency") as "once" | "weekly" | "monthly";
  const apply_to = formData.get("apply_to") as "existing_invoice" | "new_invoice";
  const excluded_group_ids = formData.getAll("excluded_group_ids") as string[];

  const { error } = await supabase
    .from("late_fee_policies")
    .update({ name, fee_type, fee_value, grace_period_days, frequency, apply_to, excluded_group_ids })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Failed to update late fee policy", error);
    throw new Error("Failed to update late fee policy");
  }

  revalidatePath("/settings/late-fees");
}

export async function toggleLateFeePolicyActive(id: string, active: boolean) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) throw new Error("No organization found.");

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("late_fee_policies")
    .update({ active })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Failed to toggle late fee policy", error);
    throw new Error("Failed to toggle late fee policy");
  }

  revalidatePath("/settings/late-fees");
}

export async function deleteLateFeePolicy(id: string) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) throw new Error("No organization found.");

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("late_fee_policies")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Failed to delete late fee policy", error);
    throw new Error("Failed to delete late fee policy");
  }

  revalidatePath("/settings/late-fees");
}
