/*
 * Customer workflow actions — the new "workflow-first" action layer.
 * These sit alongside the existing reminders.ts (automation actions) and
 * handle the collections pipeline: partial payments, promises, status updates,
 * notes, and follow-up drafting.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { enforceRateLimit } from "@/lib/abuse";
import { requireUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/payments";
import { buildPathWithQuery } from "@/lib/paths";
import {
  computeFirstReminderSendAt,
  computeRecurringReminderSendAt,
} from "@/lib/reminder-schedule";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { WorkflowStatus, CustomerRecord } from "@/lib/types";
import { getRemainingBalance } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_CUSTOMERS = 20;
const MAX_PAYMENT_LINK_LENGTH = 2048;

function redirectToDashboard(params: { error?: string; success?: string }): never {
  redirect(buildPathWithQuery("/dashboard", params));
}

function redirectToNewCustomer(error: string): never {
  redirect(buildPathWithQuery("/customers/new", { error }));
}

function redirectToNewReminder(customerId: string, error: string): never {
  redirect(buildPathWithQuery("/reminders/new", { customer_id: customerId, error }));
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

function parseMoney(input: string): number | null {
  const normalized = input.replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}

function getString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePaymentLink(link: string): string | null {
  if (link.length > MAX_PAYMENT_LINK_LENGTH) return null;
  try {
    const url = new URL(link);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Record a partial payment
// Increments amount_paid, recalculates workflow_status automatically.
// ---------------------------------------------------------------------------
export async function recordPartialPayment(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const customerId = formData.get("customer_id");
  if (typeof customerId !== "string" || !customerId) {
    redirectToDashboard({ error: "Invalid customer." });
  }

  const amountInput = formData.get("payment_amount");
  if (typeof amountInput !== "string" || !amountInput) {
    redirectToDashboard({ error: "Payment amount is required." });
  }

  const amount = parseMoney(amountInput as string);
  if (amount === null) {
    redirectToDashboard({ error: "Enter a valid payment amount." });
  }

  const supabase = await createSupabaseServerClient();

  // Fetch the current record to compute new totals
  const { data: customer, error: fetchError } = await supabase
    .from("reminders")
    .select("amount_owed, amount_paid")
    .eq("id", customerId)
    .eq("user_id", user.id)
    .maybeSingle<Pick<CustomerRecord, "amount_owed" | "amount_paid">>();

  if (fetchError || !customer) {
    redirectToDashboard({ error: "Customer not found." });
  }

  const newAmountPaid = Math.min(
    Number(customer!.amount_owed),
    Number(customer!.amount_paid) + amount!,
  );

  const remaining = Number(customer!.amount_owed) - newAmountPaid;
  const newStatus: WorkflowStatus =
    remaining <= 0 ? "paid" : newAmountPaid > 0 ? "partial" : "outstanding";

  const updatePayload: Record<string, unknown> = {
    amount_paid: newAmountPaid,
    workflow_status: newStatus,
  };

  // When fully paid via dashboard, set active=false to stop automation.
  // NOTE: client_paid_at is intentionally NOT set here — it is reserved
  // exclusively for customer self-reports via the "I've paid" email link.
  if (newStatus === "paid") {
    updatePayload.active = false;
  }

  const { error } = await supabase
    .from("reminders")
    .update(updatePayload)
    .eq("id", customerId)
    .eq("user_id", user.id);

  if (error) {
    logger.error({
      message: "Database error recording partial payment",
      context: "recordPartialPayment",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  logger.action({
    action_name: "record_partial_payment",
    reminder_id: customerId as string,
    user_id: user.id,
    success: true,
  });

  revalidatePath("/dashboard");
  redirectToDashboard({
    success:
      newStatus === "paid"
        ? "Payment recorded. Customer marked as fully paid."
        : `Payment of ${amount} recorded. ${remaining.toFixed(2)} remaining.`,
  });
}

// ---------------------------------------------------------------------------
// Mark fully paid (shortcut — sets amount_paid = amount_owed)
// ---------------------------------------------------------------------------
export async function markFullyPaid(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const customerId = formData.get("customer_id");
  if (typeof customerId !== "string" || !customerId) {
    redirectToDashboard({ error: "Invalid customer." });
  }

  const supabase = await createSupabaseServerClient();

  const { data: customer, error: fetchError } = await supabase
    .from("reminders")
    .select("amount_owed")
    .eq("id", customerId)
    .eq("user_id", user.id)
    .maybeSingle<Pick<CustomerRecord, "amount_owed">>();

  if (fetchError || !customer) {
    redirectToDashboard({ error: "Customer not found." });
  }

  const { error } = await supabase
    .from("reminders")
    .update({
      amount_paid: customer!.amount_owed,
      workflow_status: "paid",
      // NOTE: client_paid_at is intentionally NOT set here — it is reserved
      // exclusively for customer self-reports via the "I've paid" email link.
      active: false,
    })
    .eq("id", customerId)
    .eq("user_id", user.id);

  if (error) {
    logger.error({
      message: "Database error marking customer paid",
      context: "markFullyPaid",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  logger.action({
    action_name: "mark_fully_paid",
    reminder_id: customerId as string,
    user_id: user.id,
    success: true,
  });

  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Customer marked as fully paid." });
}

// ---------------------------------------------------------------------------
// Undo mark-as-paid — resets the customer back to 'outstanding'
// ---------------------------------------------------------------------------
export async function undoMarkAsPaid(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const customerId = formData.get("customer_id");
  if (typeof customerId !== "string" || !customerId) {
    redirectToDashboard({ error: "Invalid customer." });
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("reminders")
    .update({
      workflow_status: "outstanding",
      amount_paid: 0,
      client_paid_at: null,
      active: false,
    })
    .eq("id", customerId)
    .eq("user_id", user.id);

  if (error) {
    logger.error({
      message: "Database error undoing paid status",
      context: "undoMarkAsPaid",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  logger.action({
    action_name: "undo_mark_paid",
    reminder_id: customerId as string,
    user_id: user.id,
    success: true,
  });

  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Payment status reset to outstanding." });
}

// ---------------------------------------------------------------------------
// Correct the amount paid — overwrites amount_paid and recalculates status
// ---------------------------------------------------------------------------
export async function correctAmountPaid(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const customerId = formData.get("customer_id");
  if (typeof customerId !== "string" || !customerId) {
    redirectToDashboard({ error: "Invalid customer." });
  }

  const newAmountInput = formData.get("new_amount_paid");
  if (typeof newAmountInput !== "string" || !newAmountInput.trim()) {
    redirectToDashboard({ error: "New amount is required." });
  }

  const newAmountPaid = parseMoney(newAmountInput as string);
  if (newAmountPaid === null || newAmountPaid < 0) {
    redirectToDashboard({ error: "Enter a valid non-negative amount." });
  }

  const supabase = await createSupabaseServerClient();

  const { data: customer, error: fetchError } = await supabase
    .from("reminders")
    .select("amount_owed")
    .eq("id", customerId)
    .eq("user_id", user.id)
    .maybeSingle<Pick<CustomerRecord, "amount_owed">>();

  if (fetchError || !customer) {
    redirectToDashboard({ error: "Customer not found." });
  }

  const amountOwed = Number(customer!.amount_owed);
  const paid = newAmountPaid as number;
  const newStatus: WorkflowStatus =
    paid >= amountOwed ? "paid" : paid > 0 ? "partial" : "outstanding";

  const updatePayload: Record<string, unknown> = {
    amount_paid: paid,
    workflow_status: newStatus,
    // Clear client_paid_at if we're un-fully-paying (amount < owed)
    ...(paid < amountOwed ? { client_paid_at: null } : {}),
  };

  if (newStatus === "paid") {
    updatePayload.active = false;
  }

  const { error } = await supabase
    .from("reminders")
    .update(updatePayload)
    .eq("id", customerId)
    .eq("user_id", user.id);

  if (error) {
    logger.error({
      message: "Database error correcting amount paid",
      context: "correctAmountPaid",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  logger.action({
    action_name: "correct_amount_paid",
    reminder_id: customerId as string,
    user_id: user.id,
    success: true,
  });

  revalidatePath("/dashboard");
  redirectToDashboard({
    success:
      newStatus === "paid"
        ? "Amount corrected — customer is now fully paid."
        : `Amount corrected — ${paid.toFixed(2)} recorded.`,
  });
}

// ---------------------------------------------------------------------------
// Record a payment promise
// ---------------------------------------------------------------------------
export async function recordPaymentPromise(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const customerId = formData.get("customer_id");
  if (typeof customerId !== "string" || !customerId) {
    redirectToDashboard({ error: "Invalid customer." });
  }

  const promisedDateRaw = formData.get("promised_date");
  if (typeof promisedDateRaw !== "string" || !promisedDateRaw) {
    redirectToDashboard({ error: "Promised date is required." });
  }

  const promiseNotes = formData.get("promise_notes");
  const notesValue =
    typeof promiseNotes === "string" && promiseNotes.trim().length > 0
      ? promiseNotes.trim().slice(0, 500)
      : null;

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("reminders")
    .update({
      promised_date: promisedDateRaw as string,
      promise_notes: notesValue,
      workflow_status: "promised",
    })
    .eq("id", customerId)
    .eq("user_id", user.id);

  if (error) {
    logger.error({
      message: "Database error recording payment promise",
      context: "recordPaymentPromise",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  logger.action({
    action_name: "record_payment_promise",
    reminder_id: customerId as string,
    user_id: user.id,
    success: true,
  });

  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Payment promise recorded." });
}

// ---------------------------------------------------------------------------
// Save internal notes
// ---------------------------------------------------------------------------
export async function saveInternalNotes(formData: FormData) {
  const user = await requireUser();

  const customerId = formData.get("customer_id");
  if (typeof customerId !== "string" || !customerId) {
    redirectToDashboard({ error: "Invalid customer." });
  }

  const notes = formData.get("internal_notes");
  const notesValue =
    typeof notes === "string" && notes.trim().length > 0
      ? notes.trim().slice(0, 2000)
      : null;

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("reminders")
    .update({ internal_notes: notesValue })
    .eq("id", customerId)
    .eq("user_id", user.id);

  if (error) {
    redirectToDashboard({ error: "Failed to save notes." });
  }

  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Notes saved." });
}

// ---------------------------------------------------------------------------
// Update workflow status manually
// ---------------------------------------------------------------------------
export async function updateWorkflowStatus(formData: FormData) {
  const user = await requireUser();

  const customerId = formData.get("customer_id");
  if (typeof customerId !== "string" || !customerId) {
    redirectToDashboard({ error: "Invalid customer." });
  }

  const status = formData.get("workflow_status") as WorkflowStatus;
  const validStatuses: WorkflowStatus[] = [
    "outstanding",
    "promised",
    "partial",
    "paid",
    "overdue",
    "written_off",
  ];

  if (!validStatuses.includes(status)) {
    redirectToDashboard({ error: "Invalid status." });
  }

  const supabase = await createSupabaseServerClient();

  const updatePayload: Record<string, unknown> = { workflow_status: status };

  if (status === "paid") {
    const { data: customer } = await supabase
      .from("reminders")
      .select("amount_owed")
      .eq("id", customerId)
      .eq("user_id", user.id)
      .maybeSingle<Pick<CustomerRecord, "amount_owed">>();

    if (customer) {
      updatePayload.amount_paid = customer.amount_owed;
      // NOTE: client_paid_at is intentionally NOT set here — it is reserved
      // exclusively for customer self-reports via the "I've paid" email link.
      updatePayload.active = false;
    }
  }

  const { error } = await supabase
    .from("reminders")
    .update(updatePayload)
    .eq("id", customerId)
    .eq("user_id", user.id);

  if (error) {
    redirectToDashboard({ error: "Failed to update status." });
  }

  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Status updated." });
}


// ---------------------------------------------------------------------------
// Create a new customer record — no automation enabled yet.
// Redirects to /customers/new on error, /dashboard on success.
// ---------------------------------------------------------------------------
export async function createCustomer(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_create");
  } catch (error) {
    redirectToNewCustomer(getErrorMessage(error, "Please wait a moment and try again."));
  }

  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("razorpay_subscription_status, created_at")
    .eq("user_id", user.id)
    .maybeSingle<{ razorpay_subscription_status: string | null; created_at: string }>();

  if (!hasActiveSubscription(profile?.razorpay_subscription_status ?? null, profile?.created_at)) {
    redirect("/settings/billing?error=subscription_required");
  }

  const { count } = await supabase
    .from("reminders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("unsubscribed", false);

  if ((count ?? 0) >= MAX_CUSTOMERS) {
    redirectToNewCustomer(`You've reached the limit of ${MAX_CUSTOMERS} customers.`);
  }

  const recipientName = getString(formData, "recipient_name");
  if (!recipientName) redirectToNewCustomer("Customer name is required.");

  const recipientEmailRaw = getString(formData, "recipient_email");
  if (!recipientEmailRaw) redirectToNewCustomer("Customer email is required.");

  const recipientEmail = (recipientEmailRaw as string).toLowerCase();
  if (!isValidEmail(recipientEmail)) redirectToNewCustomer("Enter a valid email address.");

  if ((recipientName as string).length > 100) redirectToNewCustomer("Name is too long (max 100 chars).");
  if (recipientEmail.length > 320) redirectToNewCustomer("Email is too long.");

  const { data: existing } = await supabase
    .from("reminders")
    .select("id")
    .eq("user_id", user.id)
    .eq("recipient_email", recipientEmail)
    .eq("unsubscribed", false)
    .maybeSingle();

  if (existing) redirectToNewCustomer("A customer with this email already exists.");

  const amountInput = getString(formData, "amount_owed");
  if (!amountInput) redirectToNewCustomer("Amount owed is required.");

  const amountOwed = parseMoney(amountInput as string);
  if (amountOwed === null) redirectToNewCustomer("Enter a valid amount (e.g. 420.00).");

  const currency = getString(formData, "currency") ?? "USD";
  const dueDateRaw = getString(formData, "due_date");

  // next_send_at is required by schema — set it even though active=false
  const nextSendAt = computeFirstReminderSendAt();

  const { data: newCustomer, error } = await supabase
    .from("reminders")
    .insert({
      user_id: user.id,
      recipient_name: recipientName as string,
      recipient_email: recipientEmail,
      amount_owed: amountOwed,
      currency: currency as string,
      due_date: dueDateRaw ?? null,
      reminder_frequency_days: 7, // default; will be overridden when automation is enabled
      next_send_at: nextSendAt,
      active: false, // no automation yet
      unsubscribed: false,
      workflow_status: "outstanding",
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    logger.error({
      message: "Database error creating customer",
      context: "createCustomer",
      user_id: user.id,
      error: error.message,
    });
    redirectToNewCustomer("An unexpected error occurred. Please try again.");
  }

  logger.action({ action_name: "create_customer", user_id: user.id, success: true });

  revalidatePath("/dashboard");
  redirectToDashboard({ success: `${recipientName} added to your pipeline.` });
}

// ---------------------------------------------------------------------------
// Enable automation on an existing customer.
// Sets active=true, schedules next_send_at, persists tone/message/link.
// ---------------------------------------------------------------------------
export async function enableAutomation(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const customerId = getString(formData, "customer_id");
  if (!customerId) redirectToDashboard({ error: "Invalid customer." });

  const frequencyRaw = getString(formData, "reminder_frequency_days") ?? "7";
  const frequency = parseInt(frequencyRaw as string, 10);
  if (!Number.isFinite(frequency) || frequency < 1) {
    redirectToNewReminder(customerId as string, "Frequency must be at least 1 day.");
  }

  const customMessage = getString(formData, "custom_message");
  const messageValue =
    typeof customMessage === "string" && customMessage.length > 0
      ? customMessage.slice(0, 500)
      : null;

  const rawPaymentLink = getString(formData, "payment_link");
  const paymentLink = rawPaymentLink ? normalizePaymentLink(rawPaymentLink) : null;
  if (rawPaymentLink && !paymentLink) {
    redirectToNewReminder(customerId as string, "Enter a valid payment link (must start with https://).");
  }

  const supabase = await createSupabaseServerClient();

  const { data: customer, error: fetchError } = await supabase
    .from("reminders")
    .select("id, last_sent_at, workflow_status")
    .eq("id", customerId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; last_sent_at: string | null; workflow_status: WorkflowStatus }>();

  if (fetchError || !customer) redirectToDashboard({ error: "Customer not found." });

  // Block automation on already-paid customers
  if (customer!.workflow_status === "paid") {
    redirectToNewReminder(
      customerId as string,
      "This customer is already marked as paid. Undo the payment first if you need to re-enable reminders.",
    );
  }

  const nextSendAt = (customer!.last_sent_at
    ? computeRecurringReminderSendAt(frequency as number)
    : computeFirstReminderSendAt());

  const { error } = await supabase
    .from("reminders")
    .update({
      custom_message: messageValue,
      payment_link: paymentLink,
      reminder_frequency_days: frequency as number,
      active: true,
      next_send_at: nextSendAt,
    })
    .eq("id", customerId)
    .eq("user_id", user.id);

  if (error) {
    logger.error({
      message: "Database error enabling automation",
      context: "enableAutomation",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  logger.action({
    action_name: "enable_automation",
    reminder_id: customerId as string,
    user_id: user.id,
    success: true,
  });

  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Automation enabled. Reminders will start sending shortly." });
}

