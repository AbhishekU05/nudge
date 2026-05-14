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
import { buildPathWithQuery } from "@/lib/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { WorkflowStatus, FollowUpTone, CustomerRecord } from "@/lib/types";
import { getRemainingBalance } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function redirectToDashboard(params: { error?: string; success?: string }): never {
  redirect(buildPathWithQuery("/dashboard", params));
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
// Generate follow-up draft (template-based, tone-aware)
// Returns the draft text — used by client components via a separate API route
// since server actions can't return arbitrary data to client drawers easily.
// The templates live here so they can be imported by the API route too.
// ---------------------------------------------------------------------------

export const FOLLOWUP_TEMPLATES: Record<
  FollowUpTone,
  (name: string, amount: string, daysOverdue: number | null) => string
> = {
  friendly: (name, amount, days) =>
    `Hi ${name},\n\nI hope you're doing well! I just wanted to send a quick, friendly reminder that we have an outstanding balance of ${amount} on your account${days ? ` (${days} day${days === 1 ? "" : "s"} overdue)` : ""}.\n\nIf you've already arranged payment, please disregard this message. Otherwise, whenever you're ready — no rush!\n\nThanks so much,`,

  professional: (name, amount, days) =>
    `Dear ${name},\n\nI'm following up regarding an outstanding balance of ${amount} on your account${days ? `, which is currently ${days} day${days === 1 ? "" : "s"} past due` : ""}.\n\nPlease let me know if you have any questions, or if there's anything I can do to help facilitate payment.\n\nKind regards,`,

  firm: (name, amount, days) =>
    `Dear ${name},\n\nThis is a follow-up regarding an overdue balance of ${amount}${days ? ` — now ${days} day${days === 1 ? "" : "s"} past due` : ""}. Prompt payment is required to avoid further escalation.\n\nPlease arrange payment at your earliest convenience and confirm via reply.\n\nRegards,`,
};
