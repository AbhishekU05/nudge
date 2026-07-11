"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { enforceRateLimit } from "@/lib/abuse";
import { requireUser } from "@/lib/auth";
import { sendReminderEmail } from "@/lib/email/send-reminder";
import { buildPathWithQuery } from "@/lib/paths";
import {
  computeFirstReminderSendAt,
  computeRecurringReminderSendAt,
} from "@/lib/reminder-schedule";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { inngest } from "@/lib/inngest/client";
import type { Invoice } from "@/lib/types";

const MAX_INVOICES = 20;
const MAX_PAYMENT_LINK_LENGTH = 2048;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseMoney(input: string): number | null {
  const normalized = input.replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}

function parseIntMin(input: string, min: number): number | null {
  const value = Number.parseInt(input, 10);
  if (!Number.isFinite(value) || value < min) return null;
  return value;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePaymentLink(paymentLink: string): string | null {
  if (paymentLink.length > MAX_PAYMENT_LINK_LENGTH) return null;
  try {
    const url = new URL(paymentLink);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return fallback || "Server Error";
}

function redirectToNewReminder(error: string): never {
  redirect(buildPathWithQuery("/reminders/new", { error }));
}

function redirectToDashboard(params: { error?: string; success?: string }): never {
  redirect(buildPathWithQuery("/dashboard", params));
}

async function getOrganizationId(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
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
export async function createReminder(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_create");
  } catch (error) {
    redirectToNewReminder(getErrorMessage(error, "Please wait a minute and try again."));
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToNewReminder("No organization found. Please contact support.");

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId!)
    .eq("reminders_enabled", true);

  if ((count ?? 0) >= MAX_INVOICES) {
    redirectToNewReminder(
      `You have reached the limit of ${MAX_INVOICES} active automated reminders. Pause or remove existing ones first.`,
    );
  }

  const recipientName = getString(formData, "recipient_name");
  if (!recipientName) redirectToNewReminder("Recipient name is required.");

  const recipientEmailRaw = getString(formData, "recipient_email");
  if (!recipientEmailRaw) redirectToNewReminder("Recipient email is required.");

  const recipientEmail = recipientEmailRaw!.toLowerCase();
  if (!isValidEmail(recipientEmail)) redirectToNewReminder("Enter a valid recipient email address.");

  const amountInput = getString(formData, "amount");
  if (!amountInput) redirectToNewReminder("Amount owed is required.");

  const amount = parseMoney(amountInput!);
  if (amount == null) redirectToNewReminder("Enter a valid amount owed.");

  const currency = getString(formData, "currency") ?? "USD";

  const frequencyInput = getString(formData, "reminder_frequency_days");
  if (!frequencyInput) redirectToNewReminder("Reminder frequency is required.");

  const reminderFrequencyDays = parseIntMin(frequencyInput!, 1);
  if (reminderFrequencyDays == null) redirectToNewReminder("Reminder frequency must be at least 1 day.");

  const rawPaymentLink = getString(formData, "payment_link");
  const paymentLink = rawPaymentLink ? normalizePaymentLink(rawPaymentLink) : null;
  if (rawPaymentLink && !paymentLink) redirectToNewReminder("Enter a valid payment link.");

  if (recipientName!.length > 100) redirectToNewReminder("Recipient name is too long.");
  if (recipientEmail.length > 320) redirectToNewReminder("Recipient email is too long.");

  // Upsert client record
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("organization_id", organizationId!)
    .eq("email", recipientEmail)
    .maybeSingle();

  let clientId: string;

  if (existingClient) {
    clientId = existingClient.id;
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        organization_id: organizationId!,
        name: recipientName!,
        email: recipientEmail,
      })
      .select("id")
      .single();

    if (clientError || !newClient) {
      logger.error({ message: "Failed to create client", context: "createReminder", user_id: user.id, error: clientError?.message });
      redirectToNewReminder("An unexpected database error occurred.");
    }

    clientId = newClient!.id;
  }

  const nextSendAt = computeFirstReminderSendAt();

  const { data: newInvoice, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: organizationId!,
      client_id: clientId,
      amount: amount!,
      currency,
      payment_link: paymentLink,
      reminder_frequency_days: reminderFrequencyDays!,
      next_send_at: nextSendAt,
      reminders_enabled: true,
      status: "outstanding",
    })
    .select("id")
    .single();

  if (error || !newInvoice) {
    logger.error({
      message: "Database error creating invoice/reminder",
      context: "createReminder",
      user_id: user.id,
      error: error?.message,
    });
    redirectToNewReminder("An unexpected database error occurred.");
  }

  // Without this, next_send_at/reminders_enabled sit on the row with nothing
  // actually watching them - the durable send only happens once an
  // automation.enabled event starts the automationWorkflow for this invoice.
  await inngest.send({
    name: "automation.enabled",
    data: { entityId: newInvoice!.id, entityType: "invoice", organizationId: organizationId! },
  });

  logger.action({ action_name: "create_reminder", user_id: user.id, success: true });

  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Reminder created." });
}

// ---------------------------------------------------------------------------
// Pause / Resume / Delete
// ---------------------------------------------------------------------------
export async function pauseReminder(invoiceId: string) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a minute and try again.") });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("invoices")
    .update({ reminders_enabled: false, next_send_at: null })
    .eq("id", invoiceId)
    .eq("organization_id", organizationId!);

  if (error) {
    logger.error({ message: "Database error pausing reminder", context: "pauseReminder", user_id: user.id, error: error.message });
    redirectToDashboard({ error: "An unexpected database error occurred." });
  }

  await inngest.send({ name: "automation.disabled", data: { entityId: invoiceId } });

  logger.action({ action_name: "pause_reminder", reminder_id: invoiceId, user_id: user.id, success: true });
  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Reminder paused." });
}

export async function resumeReminder(invoiceId: string) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a minute and try again.") });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const supabase = await createSupabaseServerClient();

  const { data: current, error: selectError } = await supabase
    .from("invoices")
    .select("next_send_at, reminder_frequency_days")
    .eq("id", invoiceId)
    .eq("organization_id", organizationId!)
    .single<Pick<Invoice, "next_send_at" | "reminder_frequency_days">>();

  if (selectError || !current) {
    redirectToDashboard({ error: "Reminder not found." });
  }

  const nextSendAt = current!.next_send_at
    ? computeRecurringReminderSendAt(current!.reminder_frequency_days)
    : computeFirstReminderSendAt();

  const { error: updateError } = await supabase
    .from("invoices")
    .update({ reminders_enabled: true, next_send_at: nextSendAt })
    .eq("id", invoiceId)
    .eq("organization_id", organizationId!);

  if (updateError) {
    logger.error({ message: "Database error resuming reminder", context: "resumeReminder", user_id: user.id, error: updateError.message });
    redirectToDashboard({ error: "An unexpected database error occurred." });
  }

  await inngest.send({
    name: "automation.enabled",
    data: { entityId: invoiceId, entityType: "invoice", organizationId: organizationId! },
  });

  logger.action({ action_name: "resume_reminder", reminder_id: invoiceId, user_id: user.id, success: true });
  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Reminder resumed." });
}

export async function deleteReminder(invoiceId: string) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_delete");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a minute and try again.") });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("organization_id", organizationId!);

  if (error) {
    logger.error({ message: "Database error deleting reminder", context: "deleteReminder", user_id: user.id, error: error.message });
    redirectToDashboard({ error: "An unexpected database error occurred." });
  }

  await inngest.send({ name: "automation.disabled", data: { entityId: invoiceId } });

  logger.action({ action_name: "delete_reminder", reminder_id: invoiceId, user_id: user.id, success: true });
  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Reminder deleted." });
}

// ---------------------------------------------------------------------------
// Send test email (dev only)
// ---------------------------------------------------------------------------
export async function sendTestReminderEmail(invoiceId: string) {
  const user = await requireUser();

  if (process.env.NODE_ENV !== "development") {
    redirectToDashboard({ error: "Test email is only available in development." });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const supabase = await createSupabaseServerClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, amount, currency, payment_link, clients(name, email)")
    .eq("id", invoiceId)
    .eq("organization_id", organizationId!)
    .maybeSingle<{
      id: string;
      amount: number;
      currency: string;
      payment_link: string | null;
      clients: { name: string; email: string } | null;
    }>();

  if (error) redirectToDashboard({ error: "An unexpected database error occurred." });
  if (!invoice || !invoice.clients) redirectToDashboard({ error: "Invoice not found." });

  try {
    await sendReminderEmail({
      userId: user.id,
      senderName: user.user_metadata?.full_name || "Someone",
      senderEmail: user.email ?? "",
      recipientEmail: invoice!.clients!.email,
      recipientName: invoice!.clients!.name,
      emailSubject: null,
      customMessage: null,
      paymentLink: invoice!.payment_link,
      unsubscribeToken: "",
    });
    logger.action({ action_name: "send_test_reminder", reminder_id: invoiceId, user_id: user.id, success: true });
  } catch (sendError) {
    logger.error({
      message: "Error sending test email",
      context: "sendTestReminderEmail",
      user_id: user.id,
      error: sendError instanceof Error ? sendError.message : "Unknown error",
    });
    redirectToDashboard({ error: getErrorMessage(sendError, "Unable to send test email.") });
  }

  redirectToDashboard({ success: "Test email sent." });
}
