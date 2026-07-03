"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReminder = createReminder;
exports.pauseReminder = pauseReminder;
exports.resumeReminder = resumeReminder;
exports.deleteReminder = deleteReminder;
exports.sendTestReminderEmail = sendTestReminderEmail;
const cache_1 = require("next/cache");
const navigation_1 = require("next/navigation");
const abuse_1 = require("@/lib/abuse");
const auth_1 = require("@/lib/auth");
const send_reminder_1 = require("@/lib/email/send-reminder");
const paths_1 = require("@/lib/paths");
const reminder_schedule_1 = require("@/lib/reminder-schedule");
const server_1 = require("@/lib/supabase/server");
const logger_1 = require("@/lib/logger");
const MAX_INVOICES = 20;
const MAX_PAYMENT_LINK_LENGTH = 2048;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getString(formData, key) {
    const value = formData.get(key);
    if (typeof value !== "string")
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function parseMoney(input) {
    const normalized = input.replace(/,/g, "").trim();
    if (!/^\d+(\.\d{1,2})?$/.test(normalized))
        return null;
    const amount = Number.parseFloat(normalized);
    if (!Number.isFinite(amount) || amount <= 0)
        return null;
    return Math.round(amount * 100) / 100;
}
function parseIntMin(input, min) {
    const value = Number.parseInt(input, 10);
    if (!Number.isFinite(value) || value < min)
        return null;
    return value;
}
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function normalizePaymentLink(paymentLink) {
    if (paymentLink.length > MAX_PAYMENT_LINK_LENGTH)
        return null;
    try {
        const url = new URL(paymentLink);
        if (url.protocol !== "https:" && url.protocol !== "http:")
            return null;
        return url.toString();
    }
    catch {
        return null;
    }
}
function getErrorMessage(error, fallback) {
    return fallback || "Server Error";
}
function redirectToNewReminder(error) {
    (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/reminders/new", { error }));
}
function redirectToDashboard(params) {
    (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/dashboard", params));
}
async function getOrganizationId(userId) {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .maybeSingle();
    return data?.organization_id ?? null;
}
// ---------------------------------------------------------------------------
// Create a new invoice/reminder
// ---------------------------------------------------------------------------
async function createReminder(formData) {
    const user = await (0, auth_1.requireUser)();
    try {
        await (0, abuse_1.enforceRateLimit)(user.id, "reminder_create");
    }
    catch (error) {
        redirectToNewReminder(getErrorMessage(error, "Please wait a minute and try again."));
    }
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        redirectToNewReminder("No organization found. Please contact support.");
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { count } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("reminders_enabled", true);
    if ((count ?? 0) >= MAX_INVOICES) {
        redirectToNewReminder(`You have reached the limit of ${MAX_INVOICES} active automated reminders. Pause or remove existing ones first.`);
    }
    const recipientName = getString(formData, "recipient_name");
    if (!recipientName)
        redirectToNewReminder("Recipient name is required.");
    const recipientEmailRaw = getString(formData, "recipient_email");
    if (!recipientEmailRaw)
        redirectToNewReminder("Recipient email is required.");
    const recipientEmail = recipientEmailRaw.toLowerCase();
    if (!isValidEmail(recipientEmail))
        redirectToNewReminder("Enter a valid recipient email address.");
    const amountInput = getString(formData, "amount");
    if (!amountInput)
        redirectToNewReminder("Amount owed is required.");
    const amount = parseMoney(amountInput);
    if (amount == null)
        redirectToNewReminder("Enter a valid amount owed.");
    const currency = getString(formData, "currency") ?? "USD";
    const frequencyInput = getString(formData, "reminder_frequency_days");
    if (!frequencyInput)
        redirectToNewReminder("Reminder frequency is required.");
    const reminderFrequencyDays = parseIntMin(frequencyInput, 1);
    if (reminderFrequencyDays == null)
        redirectToNewReminder("Reminder frequency must be at least 1 day.");
    const rawPaymentLink = getString(formData, "payment_link");
    const paymentLink = rawPaymentLink ? normalizePaymentLink(rawPaymentLink) : null;
    if (rawPaymentLink && !paymentLink)
        redirectToNewReminder("Enter a valid payment link.");
    if (recipientName.length > 100)
        redirectToNewReminder("Recipient name is too long.");
    if (recipientEmail.length > 320)
        redirectToNewReminder("Recipient email is too long.");
    // Upsert client record
    const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("email", recipientEmail)
        .maybeSingle();
    let clientId;
    if (existingClient) {
        clientId = existingClient.id;
    }
    else {
        const { data: newClient, error: clientError } = await supabase
            .from("clients")
            .insert({
            organization_id: organizationId,
            name: recipientName,
            email: recipientEmail,
        })
            .select("id")
            .single();
        if (clientError || !newClient) {
            logger_1.logger.error({ message: "Failed to create client", context: "createReminder", user_id: user.id, error: clientError?.message });
            redirectToNewReminder("An unexpected database error occurred.");
        }
        clientId = newClient.id;
    }
    const nextSendAt = (0, reminder_schedule_1.computeFirstReminderSendAt)();
    const { error } = await supabase.from("invoices").insert({
        organization_id: organizationId,
        client_id: clientId,
        amount: amount,
        currency,
        payment_link: paymentLink,
        reminder_frequency_days: reminderFrequencyDays,
        next_send_at: nextSendAt,
        reminders_enabled: true,
        status: "outstanding",
    });
    if (error) {
        logger_1.logger.error({
            message: "Database error creating invoice/reminder",
            context: "createReminder",
            user_id: user.id,
            error: error.message,
        });
        redirectToNewReminder("An unexpected database error occurred.");
    }
    logger_1.logger.action({ action_name: "create_reminder", user_id: user.id, success: true });
    (0, cache_1.revalidatePath)("/dashboard");
    redirectToDashboard({ success: "Reminder created." });
}
// ---------------------------------------------------------------------------
// Pause / Resume / Delete
// ---------------------------------------------------------------------------
async function pauseReminder(invoiceId) {
    const user = await (0, auth_1.requireUser)();
    try {
        await (0, abuse_1.enforceRateLimit)(user.id, "reminder_toggle");
    }
    catch (error) {
        redirectToDashboard({ error: getErrorMessage(error, "Please wait a minute and try again.") });
    }
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        redirectToDashboard({ error: "No organization found." });
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { error } = await supabase
        .from("invoices")
        .update({ reminders_enabled: false, next_send_at: null })
        .eq("id", invoiceId)
        .eq("organization_id", organizationId);
    if (error) {
        logger_1.logger.error({ message: "Database error pausing reminder", context: "pauseReminder", user_id: user.id, error: error.message });
        redirectToDashboard({ error: "An unexpected database error occurred." });
    }
    logger_1.logger.action({ action_name: "pause_reminder", reminder_id: invoiceId, user_id: user.id, success: true });
    (0, cache_1.revalidatePath)("/dashboard");
    redirectToDashboard({ success: "Reminder paused." });
}
async function resumeReminder(invoiceId) {
    const user = await (0, auth_1.requireUser)();
    try {
        await (0, abuse_1.enforceRateLimit)(user.id, "reminder_toggle");
    }
    catch (error) {
        redirectToDashboard({ error: getErrorMessage(error, "Please wait a minute and try again.") });
    }
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        redirectToDashboard({ error: "No organization found." });
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: current, error: selectError } = await supabase
        .from("invoices")
        .select("next_send_at, reminder_frequency_days")
        .eq("id", invoiceId)
        .eq("organization_id", organizationId)
        .single();
    if (selectError || !current) {
        redirectToDashboard({ error: "Reminder not found." });
    }
    const nextSendAt = current.next_send_at
        ? (0, reminder_schedule_1.computeRecurringReminderSendAt)(current.reminder_frequency_days)
        : (0, reminder_schedule_1.computeFirstReminderSendAt)();
    const { error: updateError } = await supabase
        .from("invoices")
        .update({ reminders_enabled: true, next_send_at: nextSendAt })
        .eq("id", invoiceId)
        .eq("organization_id", organizationId);
    if (updateError) {
        logger_1.logger.error({ message: "Database error resuming reminder", context: "resumeReminder", user_id: user.id, error: updateError.message });
        redirectToDashboard({ error: "An unexpected database error occurred." });
    }
    logger_1.logger.action({ action_name: "resume_reminder", reminder_id: invoiceId, user_id: user.id, success: true });
    (0, cache_1.revalidatePath)("/dashboard");
    redirectToDashboard({ success: "Reminder resumed." });
}
async function deleteReminder(invoiceId) {
    const user = await (0, auth_1.requireUser)();
    try {
        await (0, abuse_1.enforceRateLimit)(user.id, "reminder_delete");
    }
    catch (error) {
        redirectToDashboard({ error: getErrorMessage(error, "Please wait a minute and try again.") });
    }
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        redirectToDashboard({ error: "No organization found." });
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId)
        .eq("organization_id", organizationId);
    if (error) {
        logger_1.logger.error({ message: "Database error deleting reminder", context: "deleteReminder", user_id: user.id, error: error.message });
        redirectToDashboard({ error: "An unexpected database error occurred." });
    }
    logger_1.logger.action({ action_name: "delete_reminder", reminder_id: invoiceId, user_id: user.id, success: true });
    (0, cache_1.revalidatePath)("/dashboard");
    redirectToDashboard({ success: "Reminder deleted." });
}
// ---------------------------------------------------------------------------
// Send test email (dev only)
// ---------------------------------------------------------------------------
async function sendTestReminderEmail(invoiceId) {
    const user = await (0, auth_1.requireUser)();
    if (process.env.NODE_ENV !== "development") {
        redirectToDashboard({ error: "Test email is only available in development." });
    }
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        redirectToDashboard({ error: "No organization found." });
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: invoice, error } = await supabase
        .from("invoices")
        .select("id, amount, currency, payment_link, clients(name, email)")
        .eq("id", invoiceId)
        .eq("organization_id", organizationId)
        .maybeSingle();
    if (error)
        redirectToDashboard({ error: "An unexpected database error occurred." });
    if (!invoice || !invoice.clients)
        redirectToDashboard({ error: "Invoice not found." });
    try {
        await (0, send_reminder_1.sendReminderEmail)({
            userId: user.id,
            senderName: user.user_metadata?.full_name || "Someone",
            senderEmail: user.email ?? "",
            recipientEmail: invoice.clients.email,
            recipientName: invoice.clients.name,
            emailSubject: null,
            customMessage: null,
            paymentLink: invoice.payment_link,
            unsubscribeToken: "",
        });
        logger_1.logger.action({ action_name: "send_test_reminder", reminder_id: invoiceId, user_id: user.id, success: true });
    }
    catch (sendError) {
        logger_1.logger.error({
            message: "Error sending test email",
            context: "sendTestReminderEmail",
            user_id: user.id,
            error: sendError instanceof Error ? sendError.message : "Unknown error",
        });
        redirectToDashboard({ error: getErrorMessage(sendError, "Unable to send test email.") });
    }
    redirectToDashboard({ success: "Test email sent." });
}
