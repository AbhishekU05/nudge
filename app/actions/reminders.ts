/*
 * core reminder action layer
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { enforceRateLimit } from "@/lib/abuse";
import { requireUser } from "@/lib/auth";
import { sendReminderEmail } from "@/lib/email/send-reminder";
import { hasActiveSubscription } from "@/lib/payments";
import { buildPathWithQuery } from "@/lib/paths";
import {
  computeFirstReminderSendAt,
  computeRecurringReminderSendAt,
} from "@/lib/reminder-schedule";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const MAX_REMINDERS = 5;

// Get string from form in website
// TODO: ensure safety
function getString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// get optional string from form 
// TODO: ensure safety
function getOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// converts int into currency format 
// TODO: ensure currency symbol is consistent
function parseMoney(input: string): number | null {
  const normalized = input.replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

// parses integer with minimum constraint
function parseIntMin(input: string, min: number): number | null {
  const value = Number.parseInt(input, 10);
  if (!Number.isFinite(value) || value < min) {
    return null;
  }

  return value;
}

// checks if valid email
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// extract error message
function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

// bruh is there no better way to do this
function redirectToNewReminder(error: string): never {
  redirect(buildPathWithQuery("/reminders/new", { error }));
}

// same with this guy
function redirectToDashboard(params: {
  error?: string;
  success?: string;
}): never {
  redirect(buildPathWithQuery("/dashboard", params));
}

// creates a new reminder
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
    .select("razorpay_subscription_status, created_at")
    .eq("user_id", user.id)
    .maybeSingle<{
      razorpay_subscription_status: string | null;
      created_at: string;
    }>();

  const { count } = await supabase
  .from("reminders")
  .select("*", { count: "exact", head: true })
  .eq("user_id", user.id)
  .eq("unsubscribed", false);

    // TODO: check for reminder quota as well over here
  if (
    !hasActiveSubscription(
      profile?.razorpay_subscription_status ?? null,
      profile?.created_at,
    )
  ) {
    redirect("/settings/billing?error=subscription_required");
  }

  if ((count ?? 0) >= MAX_REMINDERS) {
      redirectToNewReminder("You’ve reached the limit of 5 reminders.");
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

  const { data: existingReminder } = await supabase
    .from("reminders")
    .select("id")
    .eq("user_id", user.id)
    .eq("recipient_email", recipientEmail)
    .eq("unsubscribed", false)
    .maybeSingle();

  if (existingReminder) {
    redirectToNewReminder("You already have an active or paused reminder for this email address.");
  }

  const amountInput = getString(formData, "amount_owed");
  if (!amountInput) {
    redirectToNewReminder("Amount owed is required.");
  }

  const amountOwed = parseMoney(amountInput);
  if (amountOwed == null) {
    redirectToNewReminder("Enter a valid amount owed.");
  }

  const currencyInput = getString(formData, "currency") ?? "USD";

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

  const nextSendAt = computeFirstReminderSendAt();

  const { error } = await supabase.from("reminders").insert({
    user_id: user.id,
    recipient_name: recipientName,
    recipient_email: recipientEmail,
    amount_owed: amountOwed,
    currency: currencyInput,
    custom_message: customMessage,
    reminder_frequency_days: reminderFrequencyDays,
    next_send_at: nextSendAt,
    active: true,
    unsubscribed: false,
  });

  if (error) {
    logger.error({
      message: "Database error creating reminder",
      context: "createReminder",
      user_id: user.id,
      error: error.message,
    });
    redirectToNewReminder("An unexpected database error occurred.");
  }

  logger.action({
    action_name: "create_reminder",
    user_id: user.id,
    success: true,
  });

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
    logger.error({
      message: "Database error pausing reminder",
      context: "pauseReminder",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "An unexpected database error occurred." });
  }

  logger.action({
    action_name: "pause_reminder",
    reminder_id: reminderId,
    user_id: user.id,
    success: true,
  });

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
    .select("razorpay_subscription_status, created_at")
    .eq("user_id", user.id)
    .maybeSingle<{
      razorpay_subscription_status: string | null;
      created_at: string;
    }>();

  if (
    !hasActiveSubscription(
      profile?.razorpay_subscription_status ?? null,
      profile?.created_at,
    )
  ) {
    redirect("/settings/billing?error=subscription_required");
  }

  const { count } = await supabase
  .from("reminders")
  .select("*", { count: "exact", head: true })
  .eq("user_id", user.id)
  .eq("unsubscribed", false);

  if ((count ?? 0) >= MAX_REMINDERS) {
      redirectToDashboard({
        error: "You’ve reached the limit of 5 reminders.",
      });
    }

  const { data: current, error: selectError } = await supabase
    .from("reminders")
    .select("reminder_frequency_days,last_sent_at")
    .eq("id", reminderId)
    .eq("user_id", user.id)
    .maybeSingle<{
      reminder_frequency_days: number;
      last_sent_at: string | null;
    }>();

  if (selectError) {
    redirectToDashboard({ error: "An unexpected database error occurred." });
  }

  if (!current) {
    redirectToDashboard({ error: "Reminder not found." });
  }

  const nextSendAt = current.last_sent_at
    ? computeRecurringReminderSendAt(current.reminder_frequency_days)
    : computeFirstReminderSendAt();

  const { error } = await supabase
    .from("reminders")
    .update({ active: true, next_send_at: nextSendAt })
    .eq("id", reminderId)
    .eq("user_id", user.id);

  if (error) {
    logger.error({
      message: "Database error resuming reminder",
      context: "resumeReminder",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "An unexpected database error occurred." });
  }

  logger.action({
    action_name: "resume_reminder",
    reminder_id: reminderId,
    user_id: user.id,
    success: true,
  });

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
    logger.error({
      message: "Database error deleting reminder",
      context: "deleteReminder",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "An unexpected database error occurred." });
  }

  logger.action({
    action_name: "delete_reminder",
    reminder_id: reminderId,
    user_id: user.id,
    success: true,
  });

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
      "id,recipient_name,recipient_email,amount_owed,currency,custom_message,unsubscribe_token,unsubscribed",
    )
    .eq("id", reminderId)
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      recipient_name: string;
      recipient_email: string;
      amount_owed: number;
      currency: string;
      custom_message: string | null;
      unsubscribe_token: string;
      unsubscribed: boolean;
    }>();

  if (error) {
    redirectToDashboard({ error: "An unexpected database error occurred." });
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
      senderName: user.user_metadata?.full_name || "Someone",
      senderEmail: user.email ?? null,
      recipientEmail: reminder.recipient_email,
      recipientName: reminder.recipient_name,
      amountOwed: Number(reminder.amount_owed),
      currency: reminder.currency,
      customMessage: reminder.custom_message,
      unsubscribeToken: reminder.unsubscribe_token,
    });
    logger.action({
      action_name: "send_test_reminder",
      reminder_id: reminderId,
      user_id: user.id,
      success: true,
    });
  } catch (sendError) {
    logger.error({
      message: "Error sending test email",
      context: "sendTestReminderEmail",
      user_id: user.id,
      error: sendError instanceof Error ? sendError.message : "Unknown error",
    });
    redirectToDashboard({
      error: getErrorMessage(sendError, "Unable to send test email."),
    });
  }

  redirectToDashboard({ success: "Test email sent." });
}
