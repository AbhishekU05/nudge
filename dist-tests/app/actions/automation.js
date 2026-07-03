"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAutomationSettings = saveAutomationSettings;
exports.pauseAutomation = pauseAutomation;
const auth_1 = require("@/lib/auth");
const abuse_1 = require("@/lib/abuse");
const server_1 = require("@/lib/supabase/server");
const reminder_schedule_1 = require("@/lib/reminder-schedule");
const logger_1 = require("@/lib/logger");
const cache_1 = require("next/cache");
async function getOrganizationId(userId) {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .maybeSingle();
    return data?.organization_id ?? null;
}
async function saveAutomationSettings(formData) {
    const user = await (0, auth_1.requireUser)();
    try {
        await (0, abuse_1.enforceRateLimit)(user.id, "reminder_toggle");
    }
    catch {
        throw new Error("Please wait a moment and try again.");
    }
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        throw new Error("No organization found.");
    const invoiceId = formData.get("entity_id");
    const newEmail = formData.get("new_email");
    const reminderFrequencyDays = Number(formData.get("reminder_frequency_days") ?? 7);
    const supabase = await (0, server_1.createSupabaseServerClient)();
    // Get current invoice state to compute next_send_at
    const { data: invoice, error: fetchError } = await supabase
        .from("invoices")
        .select("next_send_at, reminders_enabled")
        .eq("id", invoiceId)
        .eq("organization_id", organizationId)
        .single();
    if (fetchError || !invoice) {
        throw new Error("Invoice not found.");
    }
    // Schedule next send only if we're enabling reminders for the first time
    let nextSendAt = undefined;
    if (!invoice.reminders_enabled) {
        nextSendAt = invoice.next_send_at
            ? (0, reminder_schedule_1.computeRecurringReminderSendAt)(reminderFrequencyDays)
            : (0, reminder_schedule_1.computeFirstReminderSendAt)();
    }
    const { error } = await supabase
        .from("invoices")
        .update({
        reminders_enabled: true,
        reminder_frequency_days: reminderFrequencyDays,
        ...(nextSendAt !== undefined && { next_send_at: nextSendAt }),
    })
        .eq("id", invoiceId)
        .eq("organization_id", organizationId);
    if (error) {
        logger_1.logger.error({
            message: "Database error saving automation settings",
            context: "saveAutomationSettings",
            user_id: user.id,
            error: error.message,
        });
        throw new Error("An unexpected error occurred while saving.");
    }
    // If a new recipient email was provided, update the parent client
    if (newEmail) {
        const { data: inv } = await supabase
            .from("invoices")
            .select("client_id")
            .eq("id", invoiceId)
            .single();
        if (inv?.client_id) {
            await supabase
                .from("clients")
                .update({ email: newEmail })
                .eq("id", inv.client_id)
                .eq("organization_id", organizationId);
        }
    }
    (0, cache_1.revalidatePath)(`/invoices/${invoiceId}`);
    (0, cache_1.revalidatePath)("/invoices");
    return { success: true };
}
async function pauseAutomation(entityType, invoiceId) {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        throw new Error("No organization found.");
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { error } = await supabase
        .from("invoices")
        .update({
        reminders_enabled: false,
        next_send_at: null,
    })
        .eq("id", invoiceId)
        .eq("organization_id", organizationId);
    if (error)
        throw new Error("Failed to pause automation");
    (0, cache_1.revalidatePath)(`/invoices/${invoiceId}`);
}
