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
import { pushPaymentToXero, pushPaymentToQuickBooks } from "@/lib/integrations-push";
import type { WorkflowStatus, CustomerRecord, PaymentLogSource, FollowUpMethod, FollowUpOutcome } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

async function insertPaymentLog({
  supabase,
  customerId,
  userId,
  amount,
  currency,
  source,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  customerId: string;
  userId: string;
  amount: number;
  currency: string;
  source: PaymentLogSource;
}) {
  const { error } = await supabase.from("customer_events").insert({
    customer_id: customerId,
    user_id: userId,
    event_type: "payment",
    event_date: new Date().toISOString().slice(0, 10),
    amount,
    currency,
    payment_source: source,
  });

  if (error) {
    logger.error({
      message: "Database error inserting payment log",
      context: "insertPaymentLog",
      user_id: userId,
      error: error.message,
    });
    return false;
  }

  return true;
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
    .from("invoices")
    .select("amount_owed, amount_paid, currency, xero_invoice_id, quickbooks_invoice_id")
    .eq("id", customerId)
    .eq("user_id", user.id)
    .maybeSingle<Pick<CustomerRecord, "amount_owed" | "amount_paid" | "currency" | "xero_invoice_id" | "quickbooks_invoice_id">>();

  if (fetchError || !customer) {
    redirectToDashboard({ error: "Customer not found." });
  }

  const remainingBefore = Number(customer!.amount_owed) - Number(customer!.amount_paid);
  if (amount! > remainingBefore) {
    redirectToDashboard({
      error: `Payment cannot exceed the remaining balance of ${remainingBefore.toFixed(2)}.`,
    });
  }

  const newAmountPaid = Number(customer!.amount_paid) + amount!;

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
    .from("invoices")
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

  const logInserted = await insertPaymentLog({
    supabase,
    customerId: customerId as string,
    userId: user.id,
    amount: amount!,
    currency: customer!.currency,
    source: "user",
  });

  if (!logInserted) {
    redirectToDashboard({
      error: "Payment was recorded, but the payment history entry could not be saved.",
    });
  }

  // Push to Integrations
  const todayIso = new Date().toISOString().slice(0, 10);
  if (customer!.xero_invoice_id) {
    pushPaymentToXero(user.id, customer!.xero_invoice_id, amount!, todayIso);
  } else if (customer!.quickbooks_invoice_id) {
    pushPaymentToQuickBooks(user.id, customer!.quickbooks_invoice_id, amount!, todayIso);
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
// Delete a payment log
// Subtracts amount_paid and recalculates workflow_status automatically.
// ---------------------------------------------------------------------------
export async function deletePaymentLog(formData: FormData) {
  const user = await requireUser();

  const logId = formData.get("log_id");
  const customerId = formData.get("customer_id");
  
  if (typeof logId !== "string" || !logId || typeof customerId !== "string" || !customerId) {
    redirectToDashboard({ error: "Invalid request." });
  }

  const supabase = await createSupabaseServerClient();

  // Get the log to know how much to subtract
  const { data: log, error: logError } = await supabase
    .from("customer_events")
    .select("amount")
    .eq("id", logId)
    .eq("user_id", user.id)
    .eq("event_type", "payment")
    .single();

  if (logError || !log) {
    redirectToDashboard({ error: "Payment log not found." });
  }

  // Get customer to calculate new totals
  const { data: customer, error: fetchError } = await supabase
    .from("invoices")
    .select("amount_owed, amount_paid")
    .eq("id", customerId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !customer) {
    redirectToDashboard({ error: "Customer not found." });
  }

  const newAmountPaid = Math.max(0, Number(customer.amount_paid) - Number(log.amount));
  const remaining = Number(customer.amount_owed) - newAmountPaid;
  const newStatus = remaining <= 0 ? "paid" : newAmountPaid > 0 ? "partial" : "outstanding";

  // Update customer
  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      amount_paid: newAmountPaid,
      workflow_status: newStatus,
    })
    .eq("id", customerId)
    .eq("user_id", user.id);

  if (updateError) {
    redirectToDashboard({ error: "Failed to update customer balance." });
  }

  // Delete the log
  const { error: deleteError } = await supabase
    .from("customer_events")
    .delete()
    .eq("id", logId)
    .eq("user_id", user.id);

  if (deleteError) {
    redirectToDashboard({ error: "Failed to delete payment log." });
  }

  logger.action({
    action_name: "delete_payment_log",
    reminder_id: customerId,
    user_id: user.id,
    success: true,
  });

  revalidatePath("/dashboard");
  revalidatePath("/customers");
  redirectToDashboard({ success: "Payment log deleted and balance updated." });
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
    .from("invoices")
    .select("amount_owed, amount_paid, currency, xero_invoice_id, quickbooks_invoice_id")
    .eq("id", customerId)
    .eq("user_id", user.id)
    .maybeSingle<Pick<CustomerRecord, "amount_owed" | "amount_paid" | "currency" | "xero_invoice_id" | "quickbooks_invoice_id">>();

  if (fetchError || !customer) {
    redirectToDashboard({ error: "Customer not found." });
  }

  const remainingBefore = Math.max(
    0,
    Number(customer!.amount_owed) - Number(customer!.amount_paid),
  );

  const { error } = await supabase
    .from("invoices")
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

  if (remainingBefore > 0) {
    const logInserted = await insertPaymentLog({
      supabase,
      customerId: customerId as string,
      userId: user.id,
      amount: remainingBefore,
      currency: customer!.currency,
      source: "user",
    });

    if (!logInserted) {
      redirectToDashboard({
        error: "Customer was marked paid, but the payment history entry could not be saved.",
      });
    }

    // Push to Integrations
    const todayIso = new Date().toISOString().slice(0, 10);
    if (customer!.xero_invoice_id) {
      pushPaymentToXero(user.id, customer!.xero_invoice_id, remainingBefore, todayIso);
    } else if (customer!.quickbooks_invoice_id) {
      pushPaymentToQuickBooks(user.id, customer!.quickbooks_invoice_id, remainingBefore, todayIso);
    }
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
    .from("invoices")
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
    .from("invoices")
    .select("amount_owed, currency")
    .eq("id", customerId)
    .eq("user_id", user.id)
    .maybeSingle<Pick<CustomerRecord, "amount_owed" | "currency">>();

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
    .from("invoices")
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

  if (paid > 0) {
    const logInserted = await insertPaymentLog({
      supabase,
      customerId: customerId as string,
      userId: user.id,
      amount: paid,
      currency: customer!.currency,
      source: "adjustment",
    });

    if (!logInserted) {
      redirectToDashboard({
        error: "Amount was corrected, but the payment history entry could not be saved.",
      });
    }
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
    .from("invoices")
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
    .from("invoices")
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
      .from("invoices")
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
  } else {
    updatePayload.client_paid_at = null;
  }

  const { error } = await supabase
    .from("invoices")
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
// Update customer email manually
// ---------------------------------------------------------------------------
export async function updateCustomerEmail(formData: FormData) {
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

  const recipientEmailRaw = formData.get("recipient_email");
  const recipientEmail = typeof recipientEmailRaw === "string" ? recipientEmailRaw.trim().toLowerCase() : "";

  if (recipientEmail && !isValidEmail(recipientEmail)) {
    redirectToDashboard({ error: "Enter a valid email address." });
  }

  const supabase = await createSupabaseServerClient();

  // Fetch the invoice first to get the customer_id
  const { data: invoice } = await supabase
    .from("invoices")
    .select("customer_id")
    .eq("id", customerId)
    .eq("user_id", user.id)
    .single();

  if (!invoice?.customer_id) {
    redirectToDashboard({ error: "Could not locate customer record for this invoice." });
  }

  // Update the clients table
  await supabase
    .from("clients")
    .update({ email: recipientEmail })
    .eq("id", invoice.customer_id)
    .eq("user_id", user.id);

  // Update ALL invoices for this client to keep them in sync
  const { error } = await supabase
    .from("invoices")
    .update({ recipient_email: recipientEmail })
    .eq("customer_id", invoice.customer_id)
    .eq("user_id", user.id);

  if (error) {
    logger.error({
      message: "Database error updating customer email",
      context: "updateCustomerEmail",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "Failed to update email." });
  }

  logger.action({
    action_name: "update_customer_email",
    reminder_id: customerId as string,
    user_id: user.id,
    success: true,
  });

  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Email updated." });
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

  const customerId = getString(formData, "customer_id");
  if (!customerId) redirectToNewCustomer("Customer selection is required.");

  const { data: clientData } = await supabase
    .from("clients")
    .select("name, email")
    .eq("id", customerId)
    .eq("user_id", user.id)
    .single();

  if (!clientData) {
    redirectToNewCustomer("Selected customer not found.");
  }

  const recipientName = clientData.name;
  const recipientEmail = clientData.email || "";



  const amountInput = getString(formData, "amount_owed");
  if (!amountInput) redirectToNewCustomer("Amount owed is required.");

  const amountOwed = parseMoney(amountInput as string);
  if (amountOwed === null) redirectToNewCustomer("Enter a valid amount (e.g. 420.00).");

  const currency = getString(formData, "currency") ?? "USD";
  const dueDateRaw = getString(formData, "due_date");

  // next_send_at is required by schema — set it even though active=false
  const nextSendAt = computeFirstReminderSendAt();

  const { error } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      customer_id: customerId,
      recipient_name: recipientName as string,
      recipient_email: recipientEmail,
      amount_owed: amountOwed,
      currency: currency as string,
      due_date: dueDateRaw ?? null,
      workflow_status: "outstanding",
    });

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

  const clientId = getString(formData, "client_id");
  if (!clientId) redirectToDashboard({ error: "Invalid client." });

  const frequencyRaw = getString(formData, "reminder_frequency_days") ?? "7";
  const frequency = parseInt(frequencyRaw as string, 10);
  if (!Number.isFinite(frequency) || frequency < 1) {
    redirectToDashboard({ error: "Frequency must be at least 1 day." });
  }

  const supabase = await createSupabaseServerClient();

  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("id, last_sent_at")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; last_sent_at: string | null }>();

  if (fetchError || !client) redirectToDashboard({ error: "Client not found." });

  // Cap active automated reminders at MAX_ACTIVE_REMINDERS
  const MAX_ACTIVE_REMINDERS = 20;
  const { count: activeCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("active", true);

  if ((activeCount ?? 0) >= MAX_ACTIVE_REMINDERS) {
    redirectToDashboard({
      error: `You have ${MAX_ACTIVE_REMINDERS} active automated reminders. Pause some before enabling more.`
    });
  }

  const autoApproveRaw = formData.get("auto_approve");
  const autoApprove = autoApproveRaw === "true" || autoApproveRaw === "on";

  const nextSendAt = (client.last_sent_at
    ? computeRecurringReminderSendAt(frequency)
    : computeFirstReminderSendAt());

  const { error } = await supabase
    .from("clients")
    .update({
      reminder_frequency_days: frequency,
      auto_approve: autoApprove,
      active: true,
      next_send_at: nextSendAt,
    })
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (error) {
    logger.error({
      message: "Database error updating client automation settings",
      context: "enableAutomation",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  logger.action({
    action_name: "enable_automation",
    reminder_id: clientId,
    user_id: user.id,
    success: true,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/customers/${clientId}`);
}

// ---------------------------------------------------------------------------
// Delete a customer — hard deletes the row from the database.
// ---------------------------------------------------------------------------
export async function deleteCustomer(formData: FormData) {
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
    .from("invoices")
    .delete()
    .eq("id", customerId)
    .eq("user_id", user.id);

  if (error) {
    logger.error({
      message: "Database error deleting customer",
      context: "deleteCustomer",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "Failed to delete customer." });
  }

  logger.action({
    action_name: "delete_customer",
    reminder_id: customerId as string,
    user_id: user.id,
    success: true,
  });

  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Customer deleted." });
}

// ---------------------------------------------------------------------------
// Update (or clear) the due date for a customer.
// ---------------------------------------------------------------------------
export async function updateDueDate(formData: FormData) {
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

  // due_date is optional — empty string clears it
  const rawDate = formData.get("due_date");
  const dueDate =
    typeof rawDate === "string" && rawDate.trim().length > 0
      ? rawDate.trim()
      : null;

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("invoices")
    .update({ due_date: dueDate })
    .eq("id", customerId)
    .eq("user_id", user.id);

  if (error) {
    logger.error({
      message: "Database error updating due date",
      context: "updateDueDate",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  logger.action({
    action_name: "update_due_date",
    reminder_id: customerId as string,
    user_id: user.id,
    success: true,
  });

  revalidatePath("/dashboard");
  redirectToDashboard({
    success: dueDate ? `Due date set to ${dueDate}.` : "Due date cleared.",
  });
}

// ---------------------------------------------------------------------------
// Log a manual follow-up — appears in the client's timeline/history.
// ---------------------------------------------------------------------------

const VALID_METHODS: FollowUpMethod[] = ["email", "call", "whatsapp", "other"];
const VALID_OUTCOMES: FollowUpOutcome[] = [
  "no_response",
  "promise_made",
  "partial_payment",
  "paid_in_full",
];

export async function logFollowUp(formData: FormData) {
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

  const followupDate = formData.get("followup_date");
  if (typeof followupDate !== "string" || !followupDate.trim()) {
    redirectToDashboard({ error: "Follow-up date is required." });
  }

  const method = formData.get("method") as FollowUpMethod;
  if (!VALID_METHODS.includes(method)) {
    redirectToDashboard({ error: "Invalid follow-up method." });
  }

  const outcome = formData.get("outcome") as FollowUpOutcome;
  if (!VALID_OUTCOMES.includes(outcome)) {
    redirectToDashboard({ error: "Invalid follow-up outcome." });
  }

  const noteRaw = formData.get("note");
  const note =
    typeof noteRaw === "string" && noteRaw.trim().length > 0
      ? noteRaw.trim().slice(0, 500)
      : null;

  const supabase = await createSupabaseServerClient();

  // Verify the customer belongs to this user
  const { data: customer, error: fetchError } = await supabase
    .from("invoices")
    .select("id")
    .eq("id", customerId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (fetchError || !customer) {
    redirectToDashboard({ error: "Customer not found." });
  }

  const { error } = await supabase.from("customer_events").insert({
    customer_id: customerId as string,
    user_id: user.id,
    event_type: "followup",
    event_date: (followupDate as string).trim(),
    followup_method: method,
    note,
    followup_outcome: outcome,
  });

  if (error) {
    logger.error({
      message: "Database error logging follow-up",
      context: "logFollowUp",
      user_id: user.id,
      error: error.message,
    });
    redirectToDashboard({ error: "Failed to log follow-up." });
  }

  logger.action({
    action_name: "log_followup",
    reminder_id: customerId as string,
    user_id: user.id,
    success: true,
  });

  revalidatePath("/dashboard");
  redirectToDashboard({ success: "Follow-up logged." });
}
