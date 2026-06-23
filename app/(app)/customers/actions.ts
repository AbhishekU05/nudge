"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createGroup(data: { name: string; description?: string; color?: string }) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("groups").insert({
    user_id: user.id,
    name: data.name,
    description: data.description || null,
    color: data.color || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/customers");
  return { success: true };
}

export async function updateGroup(
  id: string,
  data: { name?: string; description?: string; color?: string }
) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("groups")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/customers");
  return { success: true };
}

export async function deleteGroup(id: string) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/customers");
  return { success: true };
}

export async function toggleCustomerGroup(customerId: string, groupId: string, assign: boolean) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Ensure the group belongs to the user
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("id", groupId)
    .eq("user_id", user.id)
    .single();

  if (groupError || !group) {
    throw new Error("Group not found or access denied");
  }

  if (assign) {
    // Enforce one group per customer by removing existing mappings first
    await supabase.from("customer_groups").delete().eq("customer_id", customerId);

    const { error } = await supabase.from("customer_groups").insert({
      customer_id: customerId,
      group_id: groupId,
    });
    if (error && error.code !== "23505") { // Ignore unique violation if already assigned
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("customer_groups")
      .delete()
      .eq("customer_id", customerId)
      .eq("group_id", groupId);
    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/customers");
  return { success: true };
}
