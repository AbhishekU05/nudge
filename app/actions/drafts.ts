"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { sendGmail, hasGmailTokens } from "@/lib/gmail";
import { getResendClient } from "@/lib/resend";

export async function approveDraft(draftId: string) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: draft, error: fetchError } = await supabase
    .from("email_drafts")
    .select("*, clients(email, name)")
    .eq("id", draftId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !draft) {
    return { error: "Draft not found." };
  }

  if (draft.status !== "draft") {
    return { error: "Draft is not pending approval." };
  }

  // Fetch sender details
  let senderName = "Someone";
  let senderEmail = "";
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (currentUser) {
    senderName = currentUser.user_metadata?.full_name || senderName;
    senderEmail = currentUser.email || senderEmail;
  }

  const recipientEmail = draft.clients?.email;
  if (!recipientEmail) {
    return { error: "Client has no email address." };
  }

  // Send the email
  try {
    const gmailAvailable = await hasGmailTokens(user.id);
    if (gmailAvailable) {
      try {
        await sendGmail({
          userId: user.id,
          senderName,
          senderEmail,
          to: recipientEmail,
          subject: draft.subject,
          body: draft.body_html,
          html: true,
        });
      } catch (e) {
        const resend = getResendClient();
        await resend.emails.send({
          from: `${senderName} via Duely <reminders@duely.in>`,
          to: recipientEmail,
          subject: draft.subject,
          html: draft.body_html,
          replyTo: senderEmail || undefined,
        });
      }
    } else {
      const resend = getResendClient();
      await resend.emails.send({
        from: `${senderName} via Duely <reminders@duely.in>`,
        to: recipientEmail,
        subject: draft.subject,
        html: draft.body_html,
        replyTo: senderEmail || undefined,
      });
    }

    await supabase
      .from("email_drafts")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", draftId);

    logger.action({
      action_name: "approve_draft",
      user_id: user.id,
      success: true,
    });

    revalidatePath("/drafts");
    return { success: true };
  } catch (error) {
    logger.error({
      message: "Failed to send approved draft",
      context: "approve_draft",
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { error: "Failed to send email." };
  }
}

export async function deleteDraft(draftId: string) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("email_drafts")
    .update({ status: "discarded" })
    .eq("id", draftId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to delete draft." };
  }

  logger.action({
    action_name: "delete_draft",
    user_id: user.id,
    success: true,
  });

  revalidatePath("/drafts");
  return { success: true };
}
