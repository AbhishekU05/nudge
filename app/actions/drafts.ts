"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { sendGmail, hasGmailTokens } from "@/lib/gmail";
import { getResendClient } from "@/lib/resend";
import { inngest } from "@/lib/inngest/client";

async function getOrganizationId(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.organization_id ?? null;
}

export async function approveDraft(draftId: string, overrides?: { subject?: string; body_html?: string; action_payload?: Record<string, unknown> }) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) return { error: "No organization found." };

  const supabase = await createSupabaseServerClient();

  const { data: draft, error: fetchError } = await supabase
    .from("email_drafts")
    .select("*, clients(email, name)")
    .eq("id", draftId)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !draft) return { error: "Draft not found." };
  if (draft.status !== "draft") return { error: "Draft is not pending approval." };

  const finalSubject = overrides?.subject || draft.subject;
  const finalBody = overrides?.body_html || draft.body_html;
  const finalPayload = overrides?.action_payload ? { ...(draft.action_payload as Record<string, unknown>), ...overrides.action_payload } : (draft.action_payload as Record<string, unknown>);

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const senderName = currentUser?.user_metadata?.full_name || "Someone";
  const senderEmail = currentUser?.email || "";

  const recipientEmail = draft.clients?.email;
  if (!recipientEmail) return { error: "Client has no email address." };

  try {
    if (draft.action_type === "late_fee") {
      const payload = finalPayload as Record<string, string | number>;
      await inngest.send({
        name: "invoice.apply_late_fee",
        data: {
          invoiceId: payload.invoice_id as string,
          policyId: payload.policy_id as string,
          organizationId: organizationId,
          adminUserId: payload.admin_user_id as string,
          feeAmount: Number(payload.fee_amount),
          dueDate: payload.due_date ? String(payload.due_date) : undefined,
          subject: finalSubject,
          body_html: finalBody
        }
      });
      // The worker will send the email after applying the fee successfully
    } else {
      const gmailAvailable = await hasGmailTokens(user.id);
      if (gmailAvailable) {
        try {
          await sendGmail({ userId: user.id, senderName, senderEmail, to: recipientEmail, subject: finalSubject, body: finalBody, html: true });
        } catch {
          const resend = getResendClient();
          await resend.emails.send({ from: `${senderName} via Duely <reminders@duely.in>`, to: recipientEmail, subject: finalSubject, html: finalBody, replyTo: senderEmail || undefined });
        }
      } else {
        const resend = getResendClient();
        await resend.emails.send({ from: `${senderName} via Duely <reminders@duely.in>`, to: recipientEmail, subject: finalSubject, html: finalBody, replyTo: senderEmail || undefined });
      }
    }

    await supabase
      .from("email_drafts")
      .update({ status: "sent", sent_at: new Date().toISOString(), subject: finalSubject, body_html: finalBody, action_payload: finalPayload })
      .eq("id", draftId);

    logger.action({ action_name: "approve_draft", user_id: user.id, success: true });
    revalidatePath("/drafts");
    return { success: true };
  } catch (error) {
    logger.error({ message: "Failed to send approved draft", context: "approve_draft", user_id: user.id, error: error instanceof Error ? error.message : "Unknown error" });
    return { error: "Failed to send email." };
  }
}

export async function updateDraftContent(draftId: string, subject: string, body_html: string, action_payload?: Record<string, unknown>) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) return { error: "No organization found." };

  const supabase = await createSupabaseServerClient();

  const updateData: Record<string, unknown> = { subject, body_html };
  if (action_payload) {
    updateData.action_payload = action_payload;
  }

  const { error } = await supabase
    .from("email_drafts")
    .update(updateData)
    .eq("id", draftId)
    .eq("organization_id", organizationId);

  if (error) {
    logger.error({ message: "Failed to update draft", context: "updateDraftContent", error: error.message });
    return { error: "Failed to update draft." };
  }

  revalidatePath("/drafts");
  return { success: true };
}

export async function deleteDraft(draftId: string) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) return { error: "No organization found." };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("email_drafts")
    .update({ status: "discarded" })
    .eq("id", draftId)
    .eq("organization_id", organizationId);

  if (error) return { error: "Failed to delete draft." };

  logger.action({ action_name: "delete_draft", user_id: user.id, success: true });
  revalidatePath("/drafts");
  return { success: true };
}
