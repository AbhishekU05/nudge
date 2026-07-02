/*
 * sends feedback from user to server
 */
"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { sendFeedbackEmail } from "@/lib/email/send-feedback";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// main function
export async function submitFeedback(formData: FormData) {
  const user = await requireUser();
  const message = formData.get("message");

  if (typeof message !== "string" || message.trim().length === 0) {
    redirect("/feedback?error=Feedback+message+is+required.");
  }

  if (message.length > 2000) {
    redirect("/feedback?error=Feedback+message+is+too+long.");
  }

  const supabase = await createSupabaseServerClient();
  let organizationName = "Unknown Organization";
  let organizationId = "Unknown ID";

  const { data: memberData } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberData?.organization_id) {
    organizationId = memberData.organization_id;
    const { data: orgData } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle();

    if (orgData?.name) {
      organizationName = orgData.name;
    }
  }

  const enrichedMessage = `${message.trim()}\n\n---\nTenant Context:\nOrganization Name: ${organizationName}\nOrganization ID: ${organizationId}`;

  try {
    await sendFeedbackEmail({
      userEmail: user.email ?? "unknown@user.com",
      message: enrichedMessage,
    });
  } catch (error) {
    redirect(
      `/feedback?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to send feedback.",
      )}`,
    );
  }

  redirect("/dashboard?success=Thank+you+for+your+feedback!");
}
