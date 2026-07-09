"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateOrganizationLogo(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  
  const logoFile = formData.get("logo_file") as File | null;
  let logoUrl: string | null = null;
  
  if (logoFile && logoFile.size > 0) {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(logoFile.type)) {
      throw new Error("Invalid file type. Only JPEG and PNG are allowed.");
    }
    if (logoFile.size > 500 * 1024) { // Limit to 500KB
      throw new Error("Logo file must be smaller than 500KB");
    }
    const arrayBuffer = await logoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    logoUrl = `data:${logoFile.type};base64,${base64}`;
  } else {
    // If they just submitted without a file but want to clear it, handle it if needed
    // But let's assume if they don't upload a file, we don't clear it unless there's a clear action.
    // For now, if no file, we might just not update or let's say they can submit a string to clear it
    const maybeString = formData.get("logo_url")?.toString();
    if (maybeString === "") {
        logoUrl = null;
    } else {
        // If no file and no empty string request, just return early
        return;
    }
  }

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
