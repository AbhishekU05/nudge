"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { nudgeConfig } from "@/nudge.config";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function wipeMyTestData() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

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
  await adminSupabase.from("email_drafts").delete().eq("organization_id", member.organization_id);
  await adminSupabase.from("invoices").delete().eq("organization_id", member.organization_id);
  await adminSupabase.from("customer_groups").delete().eq("organization_id", member.organization_id);
  await adminSupabase.from("groups").delete().eq("organization_id", member.organization_id);
  await adminSupabase.from("clients").delete().eq("organization_id", member.organization_id);

  revalidatePath("/", "layout");
  redirect("/admin?success=Test+data+wiped+successfully");
}
