"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveDraft = approveDraft;
exports.updateDraftContent = updateDraftContent;
exports.deleteDraft = deleteDraft;
const cache_1 = require("next/cache");
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
const logger_1 = require("@/lib/logger");
const gmail_1 = require("@/lib/gmail");
const resend_1 = require("@/lib/resend");
async function getOrganizationId(userId) {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .maybeSingle();
    return data?.organization_id ?? null;
}
async function approveDraft(draftId, overrides) {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        return { error: "No organization found." };
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: draft, error: fetchError } = await supabase
        .from("email_drafts")
        .select("*, clients(email, name)")
        .eq("id", draftId)
        .eq("organization_id", organizationId)
        .single();
    if (fetchError || !draft)
        return { error: "Draft not found." };
    if (draft.status !== "draft")
        return { error: "Draft is not pending approval." };
    const finalSubject = overrides?.subject || draft.subject;
    const finalBody = overrides?.body_html || draft.body_html;
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const senderName = currentUser?.user_metadata?.full_name || "Someone";
    const senderEmail = currentUser?.email || "";
    const recipientEmail = draft.clients?.email;
    if (!recipientEmail)
        return { error: "Client has no email address." };
    try {
        const gmailAvailable = await (0, gmail_1.hasGmailTokens)(user.id);
        if (gmailAvailable) {
            try {
                await (0, gmail_1.sendGmail)({ userId: user.id, senderName, senderEmail, to: recipientEmail, subject: finalSubject, body: finalBody, html: true });
            }
            catch {
                const resend = (0, resend_1.getResendClient)();
                await resend.emails.send({ from: `${senderName} via Duely <reminders@duely.in>`, to: recipientEmail, subject: finalSubject, html: finalBody, replyTo: senderEmail || undefined });
            }
        }
        else {
            const resend = (0, resend_1.getResendClient)();
            await resend.emails.send({ from: `${senderName} via Duely <reminders@duely.in>`, to: recipientEmail, subject: finalSubject, html: finalBody, replyTo: senderEmail || undefined });
        }
        await supabase
            .from("email_drafts")
            .update({ status: "sent", sent_at: new Date().toISOString(), subject: finalSubject, body_html: finalBody })
            .eq("id", draftId);
        logger_1.logger.action({ action_name: "approve_draft", user_id: user.id, success: true });
        (0, cache_1.revalidatePath)("/drafts");
        return { success: true };
    }
    catch (error) {
        logger_1.logger.error({ message: "Failed to send approved draft", context: "approve_draft", user_id: user.id, error: error instanceof Error ? error.message : "Unknown error" });
        return { error: "Failed to send email." };
    }
}
async function updateDraftContent(draftId, subject, body_html) {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        return { error: "No organization found." };
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { error } = await supabase
        .from("email_drafts")
        .update({ subject, body_html })
        .eq("id", draftId)
        .eq("organization_id", organizationId);
    if (error) {
        logger_1.logger.error({ message: "Failed to update draft", context: "updateDraftContent", error: error.message });
        return { error: "Failed to update draft." };
    }
    (0, cache_1.revalidatePath)("/drafts");
    return { success: true };
}
async function deleteDraft(draftId) {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        return { error: "No organization found." };
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { error } = await supabase
        .from("email_drafts")
        .update({ status: "discarded" })
        .eq("id", draftId)
        .eq("organization_id", organizationId);
    if (error)
        return { error: "Failed to delete draft." };
    logger_1.logger.action({ action_name: "delete_draft", user_id: user.id, success: true });
    (0, cache_1.revalidatePath)("/drafts");
    return { success: true };
}
