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

// How long a 'sending' claim is respected before another approval may take it
// over. A send takes seconds; anything still claimed after this was abandoned by
// a process that died before it could finish or release the claim.
const CLAIM_TIMEOUT_MS = 2 * 60 * 1000;

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
  // 'sending' is allowed through: it may be an abandoned claim, and the atomic
  // claim below is what decides whether this caller may actually take it. This
  // check only rejects rows that are definitively finished.
  if (draft.status !== "draft" && draft.status !== "sending") {
    return { error: "Draft is not pending approval." };
  }

  const finalSubject = overrides?.subject || draft.subject;
  const finalBody = overrides?.body_html || draft.body_html;
  const finalPayload = overrides?.action_payload ? { ...(draft.action_payload as Record<string, unknown>), ...overrides.action_payload } : (draft.action_payload as Record<string, unknown>);

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const senderName = currentUser?.user_metadata?.full_name || "Someone";
  const senderEmail = currentUser?.email || "";

  const recipientEmail = draft.clients?.email;
  if (!recipientEmail) return { error: "Client has no email address." };

  // Claim the draft before sending. The status check above is a read followed by
  // a write, which is not atomic: two concurrent approvals (a double-click, a
  // resubmitted form) could both see status 'draft' and both send. This UPDATE is
  // conditional, so exactly one caller can win it - the loser matches no row, gets
  // `claimed == null`, and reports the truth instead of silently succeeding.
  //
  // A claim is winnable in two cases: the row is still 'draft', or it is 'sending'
  // but the claim was abandoned (the process died mid-send and never released it).
  // Without the second case a stranded row could never be retried at all. The
  // cutoff is what separates "someone else is sending this right now" from "nobody
  // ever finished"; sends take seconds, so two minutes is not close.
  const staleClaimCutoff = new Date(Date.now() - CLAIM_TIMEOUT_MS).toISOString();

  const { data: claimed, error: claimError } = await supabase
    .from("email_drafts")
    .update({ status: "sending", claimed_at: new Date().toISOString() })
    .eq("id", draftId)
    .eq("organization_id", organizationId)
    .or(`status.eq.draft,and(status.eq.sending,claimed_at.lt.${staleClaimCutoff})`)
    .select("id")
    .maybeSingle();

  if (claimError) {
    logger.error({ message: "Failed to claim draft for sending", context: "approve_draft", user_id: user.id, error: claimError.message });
    return { error: "Failed to send email." };
  }
  if (!claimed) return { error: "This draft is already being sent." };

  // Hand the claim back if we never get as far as sending, so a transient failure
  // does not strand the draft in 'sending' where neither the Drafts nor the Sent
  // list would show it.
  const releaseClaim = async () => {
    await supabase
      .from("email_drafts")
      .update({ status: "draft", claimed_at: null })
      .eq("id", draftId)
      .eq("organization_id", organizationId)
      .eq("status", "sending");
  };

  let resendEmailId: string | null = null;

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
      // Resend's id, kept so the delivery webhook can match a bounce or complaint
      // back to this row hours later. Gmail sends have no id and no webhooks, so
      // they stay null and remain untracked rather than claiming delivery.
      const sendViaResend = async () => {
        const resend = getResendClient();
        const { data, error } = await resend.emails.send(
          {
            from: `${senderName} via Duely <reminders@duely.in>`,
            to: recipientEmail,
            subject: finalSubject,
            html: finalBody,
            replyTo: senderEmail || undefined,
          },
          // The draft status check above is not atomic: two concurrent approvals
          // (a double-click, a retried submission) can both read status 'draft'
          // and both send. Keying on the draft means Resend delivers once.
          { idempotencyKey: `draft-${draftId}` }
        );
        // The SDK reports failures in `error` rather than throwing, so without
        // this a rejected send was still recorded as "sent".
        if (error) throw new Error(error.message);
        return data?.id ?? null;
      };

      const gmailAvailable = await hasGmailTokens(user.id);
      if (gmailAvailable) {
        try {
          await sendGmail({ userId: user.id, senderName, senderEmail, to: recipientEmail, subject: finalSubject, body: finalBody, html: true });
        } catch {
          resendEmailId = await sendViaResend();
        }
      } else {
        resendEmailId = await sendViaResend();
      }
    }

    await supabase
      .from("email_drafts")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        subject: finalSubject,
        body_html: finalBody,
        action_payload: finalPayload,
        resend_email_id: resendEmailId,
        // Resend only confirms hand-off here; delivered/bounced/delayed arrive
        // later over the webhook.
        delivery_status: resendEmailId ? "sent" : null,
        delivery_status_at: resendEmailId ? new Date().toISOString() : null,
      })
      .eq("id", draftId);

    logger.action({ action_name: "approve_draft", user_id: user.id, success: true });
    revalidatePath("/drafts");
    return { success: true };
  } catch (error) {
    // Put the draft back so it reappears in the Drafts list and can be retried.
    // Note the email may already have gone out (the failure could be the write
    // that follows the send) - the idempotency key on the Resend call is what
    // stops a retry from mailing the client a second time.
    await releaseClaim();

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
