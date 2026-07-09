"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateOrganizationLogo(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  
  const logoUrl = formData.get("logo_url")?.toString() || null;

  // Verify membership
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    throw new Error("Not a member of an organization");
  }

  // Update org
  await supabase
    .from("organizations")
    .update({ logo_url: logoUrl })
    .eq("id", member.organization_id);

  revalidatePath("/settings/organization");
}
