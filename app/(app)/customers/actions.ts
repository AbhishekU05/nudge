"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createGroup(data: { name: string; description?: string; color?: string }) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!member) throw new Error("No organization found");

  const { error } = await supabase.from("groups").insert({
    organization_id: member.organization_id,
    name: data.name,
    description: data.description || null,
    color: data.color || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/customers");
  return { success: true };
}

export async function updateGroup(
  id: string,
  data: { name?: string; description?: string; color?: string }
) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("groups")
    .update(data)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/customers");
  return { success: true };
}

export async function deleteGroup(id: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/customers");
  return { success: true };
}

/**
 * Assign or unassign a client (customer) to a group.
 * customer_groups.customer_id references clients.id — that's the real column name.
 */
export async function toggleCustomerGroup(customerId: string, groupId: string, assign: boolean) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  // Verify the group exists (RLS will scope to the org)
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("Group not found or access denied");
  }

  if (assign) {
    // One group per customer — remove any existing assignment first
    await supabase.from("customer_groups").delete().eq("customer_id", customerId);

    const { error } = await supabase.from("customer_groups").insert({
      customer_id: customerId,
      group_id: groupId,
    });
    // Ignore unique constraint violations (already assigned)
    if (error && error.code !== "23505") {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("customer_groups")
      .delete()
      .eq("customer_id", customerId)
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/customers");
  return { success: true };
}
