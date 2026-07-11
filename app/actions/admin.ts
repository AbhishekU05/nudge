"use server";

import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { nudgeConfig } from "@/nudge.config";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function wipeMyTestData() {
  await requireAdmin();

  const adminSupabase = createSupabaseAdminClient();
  const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();
  
  if (usersError || !users) {
    throw new Error("Failed to fetch users to identify admin");
  }

  // Find the admin user based on the config file
  const adminUser = users.find(u => u.email && nudgeConfig.adminEmails.includes(u.email));

  if (!adminUser) {
    throw new Error("Admin user not found in the database");
  }

  const { data: member } = await adminSupabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", adminUser.id)
    .single();

  if (!member) {
    // If the admin doesn't have an organization, there is no data to delete (since all data requires an org_id)
    redirect("/admin?success=Admin+has+no+organization+to+wipe");
  }

  // Delete all data associated with the admin's organization in reverse dependency order
  await adminSupabase.from("payments").delete().eq("organization_id", member.organization_id);
  await adminSupabase.from("events").delete().eq("organization_id", member.organization_id);
  await adminSupabase.from("invoices").delete().eq("organization_id", member.organization_id);
  
  // Note: customer_groups does not have organization_id. It will be deleted by CASCADE from clients.
  await adminSupabase.from("groups").delete().eq("organization_id", member.organization_id);
  await adminSupabase.from("clients").delete().eq("organization_id", member.organization_id);

  revalidatePath("/", "layout");
  redirect("/admin?success=Test+data+wiped+successfully");
}

export async function grantAdminLifetimeAccess() {
  await requireAdmin();

  const adminSupabase = createSupabaseAdminClient();
  const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();
  
  if (usersError || !users) {
    throw new Error("Failed to fetch users");
  }

  const adminUser = users.find(u => u.email && nudgeConfig.adminEmails.includes(u.email));
  if (!adminUser) throw new Error("Admin not found");

  const { data: member } = await adminSupabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", adminUser.id)
    .single();

  if (!member) {
    redirect("/admin?success=Admin+has+no+organization+yet");
  }

  // Force the organization to appear as having an active annual subscription
  await adminSupabase
    .from("organizations")
    .update({
      dodo_subscription_status: "active",
      plan_type: "annual",
    })
    .eq("id", member.organization_id);

  revalidatePath("/", "layout");
  redirect("/admin?success=Lifetime+access+granted+to+admin+org!");
}

export async function toggleQuickBooksMode(currentMode: "production" | "sandbox") {
  const { setQuickBooksMode } = await import("@/lib/platform-settings");
  await requireAdmin();

  const newMode = currentMode === "production" ? "sandbox" : "production";
  await setQuickBooksMode(newMode);
  
  revalidatePath("/admin/config");
  redirect("/admin/config?success=QuickBooks+Mode+Toggled");
}
