"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { enforceRateLimit, recordUsageEvent } from "@/lib/abuse";
import { requireUser } from "@/lib/auth";
import { sendReminderEmail } from "@/lib/email/send-reminder";
import { hasActiveSubscription } from "@/lib/lemon";
import { buildPathWithQuery } from "@/lib/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseMoney(input: string): number | null {
  const normalized = input.replace(/[^0-9.]/g, "");
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

function parseIntMin(input: string, min: number): number | null {
  const value = Number.parseInt(input, 10);
  if (!Number.isFinite(value) || value < min) {
    return null;
  }

  return value;
}

function computeNextSendAt(reminderFrequencyDays: number): string {
  const minMs = 24 * 60 * 60 * 1000;
  const requestedMs = reminderFrequencyDays * 24 * 60 * 60 * 1000;
  const ms = Math.max(minMs, requestedMs);
  return new Date(Date.now() + ms).toISOString();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function redirectToNewReminder(error: string): never {
  redirect(buildPathWithQuery("/reminders/new", { error }));
}

function redirectToDashboard(params: {
  error?: string;
  success?: string;
}): never {
  redirect(buildPathWithQuery("/dashboard", params));
}

export async function createReminder(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_create");
  } catch (error) {
    redirectToNewReminder(
      getErrorMessage(error, "Please wait a minute and try again."),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("lemon_subscription_status")
    .eq("user_id", user.id)
    .maybeSingle<{ lemon_subscription_status: string | null }>();

  if (!hasActiveSubscription(profile?.lemon_subscription_status ?? null)) {
    redirect("/settings/billing?error=subscription_required");
  }

  const recipientName = getString(formData, "recipient_name");
  if (!recipientName) {
    redirectToNewReminder("Recipient name is required.");
  }

  const recipientEmailValue = getString(formData, "recipient_email");
  if (!recipientEmailValue) {
    redirectToNewReminder("Recipient email is required.");
  }

  const recipientEmail = recipientEmailValue.toLowerCase();
  if (!isValidEmail(recipientEmail)) {
    redirectToNewReminder("Enter a valid recipient email address.");
  }

  const amountInput = getString(formData, "amount_owed");
  if (!amountInput) {
    redirectToNewReminder("Amount owed is required.");
  }

  const amountOwed = parseMoney(amountInput);
  if (amountOwed == null) {
    redirectToNewReminder("Enter a valid amount owed.");
  }

  const frequencyInput = getString(formData, "reminder_frequency_days");
  if (!frequencyInput) {
    redirectToNewReminder("Reminder frequency is required.");
  }

  const reminderFrequencyDays = parseIntMin(frequencyInput, 1);
  if (reminderFrequencyDays == null) {
    redirectToNewReminder("Reminder frequency must be at least 1 day.");
  }

  const customMessage = getOptionalString(formData, "custom_message");

  if (recipientName.length > 100) {
    redirectToNewReminder("Recipient name is too long.");
  }

  if (recipientEmail.length > 320) {
    redirectToNewReminder("Recipient email is too long.");
  }

  if (customMessage && customMessage.length > 500) {
    redirectToNewReminder("Custom message is too long (max 500 chars).");
  }

  const nextSendAt = computeNextSendAt(reminderFrequencyDays);

  const { error } = await supabase.from("reminders").insert({
    user_id: user.id,
    recipient_name: recipientName,
    recipient_email: recipientEmail,
    amount_owed: amountOwed,
    custom_message: customMessage,
    reminder_frequency_days: reminderFrequencyDays,
    next_send_at: nextSendAt,
    active: true,
    unsubscribed: false,
  });

  if (error) {
    redirectToNewReminder(error.message);
  }

  await recordUsageEvent(user.id, "reminder_create");
  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Reminder created." });
}

export async function pauseReminder(reminderId: string) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({
      error: getErrorMessage(error, "Please wait a minute and try again."),
    });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("reminders")
    .update({ active: false })
    .eq("id", reminderId)
    .eq("user_id", user.id);

  if (error) {
    redirectToDashboard({ error: error.message });
  }

  await recordUsageEvent(user.id, "reminder_toggle");
  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Reminder paused." });
}

export async function resumeReminder(reminderId: string) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({
      error: getErrorMessage(error, "Please wait a minute and try again."),
    });
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("lemon_subscription_status")
    .eq("user_id", user.id)
    .maybeSingle<{ lemon_subscription_status: string | null }>();

  if (!hasActiveSubscription(profile?.lemon_subscription_status ?? null)) {
    redirect("/settings/billing?error=subscription_required");
  }

  const { data: current, error: selectError } = await supabase
    .from("reminders")
    .select("reminder_frequency_days")
    .eq("id", reminderId)
    .eq("user_id", user.id)
    .maybeSingle<{ reminder_frequency_days: number }>();

  if (selectError) {
    redirectToDashboard({ error: selectError.message });
  }

  if (!current) {
    redirectToDashboard({ error: "Reminder not found." });
  }

  const nextSendAt = computeNextSendAt(current.reminder_frequency_days);

  const { error } = await supabase
    .from("reminders")
    .update({ active: true, next_send_at: nextSendAt })
    .eq("id", reminderId)
    .eq("user_id", user.id);

  if (error) {
    redirectToDashboard({ error: error.message });
  }

  await recordUsageEvent(user.id, "reminder_toggle");
  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Reminder resumed." });
}

export async function deleteReminder(reminderId: string) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_delete");
  } catch (error) {
    redirectToDashboard({
      error: getErrorMessage(error, "Please wait a minute and try again."),
    });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", reminderId)
    .eq("user_id", user.id);

  if (error) {
    redirectToDashboard({ error: error.message });
  }

  await recordUsageEvent(user.id, "reminder_delete");
  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Reminder deleted." });
}

export async function sendTestReminderEmail(reminderId: string) {
  const user = await requireUser();

  if (process.env.NODE_ENV !== "development") {
    redirectToDashboard({
      error: "Test email is only available in development.",
    });
  }

  const supabase = await createSupabaseServerClient();
  const { data: reminder, error } = await supabase
    .from("reminders")
    .select(
      "id,recipient_name,recipient_email,amount_owed,custom_message,unsubscribe_token,unsubscribed",
    )
    .eq("id", reminderId)
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      recipient_name: string;
      recipient_email: string;
      amount_owed: number;
      custom_message: string | null;
      unsubscribe_token: string;
      unsubscribed: boolean;
    }>();

  if (error) {
    redirectToDashboard({ error: error.message });
  }

  if (!reminder) {
    redirectToDashboard({ error: "Reminder not found." });
  }

  if (reminder.unsubscribed) {
    redirectToDashboard({
      error: "Cannot send a test email for an unsubscribed reminder.",
    });
  }

  try {
    await sendReminderEmail({
      recipientEmail: reminder.recipient_email,
      recipientName: reminder.recipient_name,
      amountOwed: Number(reminder.amount_owed),
      customMessage: reminder.custom_message,
      unsubscribeToken: reminder.unsubscribe_token,
    });
  } catch (sendError) {
    redirectToDashboard({
      error: getErrorMessage(sendError, "Unable to send test email."),
    });
  }

  redirectToDashboard({ success: "Test email sent." });
}
