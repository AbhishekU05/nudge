/*
 * Invoice workflow actions — collections pipeline: payments, promises,
 * status updates, notes, follow-ups, and CRM event logging.
 * All data access is scoped to organization_id via RLS.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { enforceRateLimit } from "@/lib/abuse";
import { requireUser } from "@/lib/auth";
import { buildPathWithQuery } from "@/lib/paths";
import { computeFirstReminderSendAt } from "@/lib/reminder-schedule";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { pushPaymentToXero, pushPaymentToQuickBooks } from "@/lib/integrations-push";
import type { InvoiceStatus, CrmEventType } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------


function redirectToDashboard(params: { error?: string; success?: string }): never {
  redirect(buildPathWithQuery("/dashboard", params));
}

function redirectToNewCustomer(error: string): never {
  redirect(buildPathWithQuery("/customers/new", { error }));
}

function getErrorMessage(error: unknown, fallback: string) {
  return fallback || "Server Error";
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



async function getOrganizationId(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.organization_id ?? null;
}

/**
 * Records a payment entry in the payments table and optionally pushes to
 * accounting integrations (Xero / QuickBooks).
 */
async function insertPayment({
  supabase,
  organizationId,
  invoiceId,
  amount,
  currency,
  xeroId,
  quickbooksId,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organizationId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  xeroId?: string | null;
  quickbooksId?: string | null;
}): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("payments").insert({
    organization_id: organizationId,
    invoice_id: invoiceId,
    amount,
    currency,
    payment_date: today,
    payment_method: "manual",
  });

  if (error) {
    logger.error({
      message: "Database error inserting payment",
      context: "insertPayment",
      error: error.message,
    });
    return false;
  }

  if (xeroId) pushPaymentToXero(organizationId, xeroId, amount, today);
  else if (quickbooksId) pushPaymentToQuickBooks(organizationId, quickbooksId, amount, today);

  return true;
}

async function logEvent({
  supabase,
  organizationId,
  invoiceId,
  clientId,
  eventType,
  description,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organizationId: string;
  invoiceId?: string;
  clientId?: string;
  eventType: CrmEventType;
  description?: string;
}) {
  await supabase.from("events").insert({
    organization_id: organizationId,
    invoice_id: invoiceId ?? null,
    client_id: clientId ?? null,
    event_type: eventType,
    description: description ?? null,
  });
}

// ---------------------------------------------------------------------------
// Create a new invoice for an existing client
// ---------------------------------------------------------------------------
export async function createCustomer(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_create");
  } catch (error) {
    redirectToNewCustomer(getErrorMessage(error, "Please wait a moment and try again."));
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirect("/settings/billing?error=subscription_required");

  const supabase = await createSupabaseServerClient();
  const clientId = getString(formData, "customer_id");
  if (!clientId) redirectToNewCustomer("Customer selection is required.");

  const { data: clientData } = await supabase
    .from("clients")
    .select("name, email")
    .eq("id", clientId!)
    .eq("organization_id", organizationId)
    .single();

  if (!clientData) redirectToNewCustomer("Selected customer not found.");

  const amountInput = getString(formData, "amount_owed");
  if (!amountInput) redirectToNewCustomer("Amount owed is required.");

  const amount = parseMoney(amountInput!);
  if (amount === null) redirectToNewCustomer("Enter a valid amount (e.g. 420.00).");

  const currency = getString(formData, "currency") ?? "USD";
  const dueDateRaw = getString(formData, "due_date");
  const nextSendAt = computeFirstReminderSendAt();

  const { error } = await supabase.from("invoices").insert({
    organization_id: organizationId,
    client_id: clientId!,
    amount: amount!,
    currency,
    due_date: dueDateRaw ?? null,
    status: "outstanding" as InvoiceStatus,
    next_send_at: nextSendAt,
    reminders_enabled: false,
  });

  if (error) {
    logger.error({ message: "Database error creating invoice", context: "createCustomer", user_id: user.id, error: error.message });
    redirectToNewCustomer("An unexpected error occurred. Please try again.");
  }

  logger.action({ action_name: "create_invoice", user_id: user.id, success: true });
  revalidatePath("/", "layout");
  redirectToDashboard({ success: `${clientData!.name} added to your pipeline.` });
}

// ---------------------------------------------------------------------------
// Record a partial payment
// ---------------------------------------------------------------------------
export async function recordPartialPayment(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const invoiceId = formData.get("customer_id");
  if (typeof invoiceId !== "string" || !invoiceId) redirectToDashboard({ error: "Invalid invoice." });

  const amountInput = formData.get("payment_amount");
  if (typeof amountInput !== "string" || !amountInput) redirectToDashboard({ error: "Payment amount is required." });

  const amount = parseMoney(amountInput as string);
  if (amount === null) redirectToDashboard({ error: "Enter a valid payment amount." });

  const supabase = await createSupabaseServerClient();

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("amount, currency, xero_id, quickbooks_id, client_id")
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!)
    .maybeSingle<{ amount: number; currency: string; xero_id: string | null; quickbooks_id: string | null; client_id: string }>();

  if (fetchError || !invoice) redirectToDashboard({ error: "Invoice not found." });

  // Sum existing payments to compute remaining balance
  const { data: paymentsData } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoiceId as string);

  const totalPaid = (paymentsData ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Number(invoice!.amount) - totalPaid;

  if (amount! > remaining) {
    redirectToDashboard({ error: `Payment cannot exceed the remaining balance of ${remaining.toFixed(2)}.` });
  }

  const newTotalPaid = totalPaid + amount!;
  const newRemaining = Number(invoice!.amount) - newTotalPaid;
  const newStatus: InvoiceStatus = newRemaining <= 0 ? "paid" : newTotalPaid > 0 ? "partial" : "outstanding";

  const { error } = await supabase
    .from("invoices")
    .update({ status: newStatus, ...(newStatus === "paid" ? { reminders_enabled: false } : {}) })
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!);

  if (error) {
    logger.error({ message: "Database error recording partial payment", context: "recordPartialPayment", user_id: user.id, error: error.message });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  const inserted = await insertPayment({
    supabase,
    organizationId: organizationId!,
    invoiceId: invoiceId as string,
    amount: amount!,
    currency: invoice!.currency,
    xeroId: invoice!.xero_id,
    quickbooksId: invoice!.quickbooks_id,
  });

  if (!inserted) redirectToDashboard({ error: "Payment was recorded, but the payment history entry could not be saved." });

  await logEvent({ supabase, organizationId: organizationId!, invoiceId: invoiceId as string, clientId: invoice!.client_id, eventType: "status_change", description: `Payment of ${amount!.toFixed(2)} ${invoice!.currency} recorded.` });

  logger.action({ action_name: "record_partial_payment", reminder_id: invoiceId as string, user_id: user.id, success: true });
  revalidatePath("/", "layout");
  redirectToDashboard({
    success: newStatus === "paid"
      ? "Payment recorded. Invoice marked as fully paid."
      : `Payment of ${amount} recorded. ${newRemaining.toFixed(2)} remaining.`,
  });
}

// ---------------------------------------------------------------------------
// Mark fully paid
// ---------------------------------------------------------------------------
export async function markFullyPaid(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const invoiceId = formData.get("customer_id");
  if (typeof invoiceId !== "string" || !invoiceId) redirectToDashboard({ error: "Invalid invoice." });

  const supabase = await createSupabaseServerClient();

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("amount, currency, xero_id, quickbooks_id, client_id")
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!)
    .maybeSingle<{ amount: number; currency: string; xero_id: string | null; quickbooks_id: string | null; client_id: string }>();

  if (fetchError || !invoice) redirectToDashboard({ error: "Invoice not found." });

  const { data: paymentsData } = await supabase.from("payments").select("amount").eq("invoice_id", invoiceId as string);
  const totalPaid = (paymentsData ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, Number(invoice!.amount) - totalPaid);

  const { error } = await supabase
    .from("invoices")
    .update({ status: "paid" as InvoiceStatus, reminders_enabled: false })
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!);

  if (error) {
    logger.error({ message: "Database error marking paid", context: "markFullyPaid", user_id: user.id, error: error.message });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  if (remaining > 0) {
    await insertPayment({
      supabase,
      organizationId: organizationId!,
      invoiceId: invoiceId as string,
      amount: remaining,
      currency: invoice!.currency,
      xeroId: invoice!.xero_id,
      quickbooksId: invoice!.quickbooks_id,
    });
  }

  await logEvent({ supabase, organizationId: organizationId!, invoiceId: invoiceId as string, clientId: invoice!.client_id, eventType: "status_change", description: "Invoice marked as fully paid." });

  logger.action({ action_name: "mark_fully_paid", reminder_id: invoiceId as string, user_id: user.id, success: true });
  revalidatePath("/", "layout");
  redirectToDashboard({ success: "Invoice marked as fully paid." });
}

// ---------------------------------------------------------------------------
// Undo mark-as-paid
// ---------------------------------------------------------------------------
export async function undoMarkAsPaid(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const invoiceId = formData.get("customer_id");
  if (typeof invoiceId !== "string" || !invoiceId) redirectToDashboard({ error: "Invalid invoice." });

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("invoices")
    .update({ status: "outstanding" as InvoiceStatus })
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!);

  if (error) {
    logger.error({ message: "Database error undoing paid status", context: "undoMarkAsPaid", user_id: user.id, error: error.message });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  // Delete all payments for this invoice so the balance is clean
  await supabase.from("payments").delete().eq("invoice_id", invoiceId as string);

  logger.action({ action_name: "undo_mark_paid", reminder_id: invoiceId as string, user_id: user.id, success: true });
  revalidatePath("/", "layout");
  redirectToDashboard({ success: "Payment status reset to outstanding." });
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

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const invoiceId = formData.get("customer_id");
  if (typeof invoiceId !== "string" || !invoiceId) redirectToDashboard({ error: "Invalid invoice." });

  const promisedDateRaw = formData.get("promised_date");
  if (typeof promisedDateRaw !== "string" || !promisedDateRaw) redirectToDashboard({ error: "Promised date is required." });

  const promiseNotes = formData.get("promise_notes");
  const notesValue = typeof promiseNotes === "string" && promiseNotes.trim().length > 0
    ? promiseNotes.trim().slice(0, 500)
    : null;

  const supabase = await createSupabaseServerClient();

  const { data: invoice } = await supabase.from("invoices").select("client_id").eq("id", invoiceId as string).eq("organization_id", organizationId!).single();

  const { error } = await supabase
    .from("invoices")
    .update({ status: "promised" as InvoiceStatus })
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!);

  if (error) {
    logger.error({ message: "Database error recording payment promise", context: "recordPaymentPromise", user_id: user.id, error: error.message });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  await logEvent({
    supabase,
    organizationId: organizationId!,
    invoiceId: invoiceId as string,
    clientId: invoice?.client_id,
    eventType: "followup",
    description: `Payment promised by ${promisedDateRaw as string}.${notesValue ? ` Note: ${notesValue}` : ""}`,
  });

  logger.action({ action_name: "record_payment_promise", reminder_id: invoiceId as string, user_id: user.id, success: true });
  revalidatePath("/", "layout");
  redirectToDashboard({ success: "Payment promise recorded." });
}

// ---------------------------------------------------------------------------
// Update invoice status manually
// ---------------------------------------------------------------------------
export async function updateWorkflowStatus(formData: FormData) {
  const user = await requireUser();

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const invoiceId = formData.get("customer_id");
  if (typeof invoiceId !== "string" || !invoiceId) redirectToDashboard({ error: "Invalid invoice." });

  const status = formData.get("workflow_status") as InvoiceStatus;
  const validStatuses: InvoiceStatus[] = ["outstanding", "promised", "partial", "paid", "overdue", "written_off"];
  if (!validStatuses.includes(status)) redirectToDashboard({ error: "Invalid status." });

  const supabase = await createSupabaseServerClient();

  const updatePayload: Record<string, unknown> = { status };
  if (status === "paid") updatePayload.reminders_enabled = false;

  const { error } = await supabase
    .from("invoices")
    .update(updatePayload)
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!);

  if (error) redirectToDashboard({ error: "Failed to update status." });

  await logEvent({ supabase, organizationId: organizationId!, invoiceId: invoiceId as string, eventType: "status_change", description: `Status changed to ${status}.` });

  revalidatePath("/", "layout");
  redirectToDashboard({ success: "Status updated." });
}

// ---------------------------------------------------------------------------
// Update client email
// ---------------------------------------------------------------------------
export async function updateCustomerEmail(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const invoiceId = formData.get("customer_id");
  if (typeof invoiceId !== "string" || !invoiceId) redirectToDashboard({ error: "Invalid invoice." });

  const recipientEmail = (formData.get("recipient_email") as string | null)?.trim().toLowerCase() ?? "";
  if (recipientEmail && !isValidEmail(recipientEmail)) redirectToDashboard({ error: "Enter a valid email address." });

  const supabase = await createSupabaseServerClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("client_id")
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!)
    .single();

  if (!invoice?.client_id) redirectToDashboard({ error: "Could not locate client for this invoice." });

  const { error } = await supabase
    .from("clients")
    .update({ email: recipientEmail })
    .eq("id", invoice!.client_id)
    .eq("organization_id", organizationId!);

  if (error) {
    logger.error({ message: "Database error updating client email", context: "updateCustomerEmail", user_id: user.id, error: error.message });
    redirectToDashboard({ error: "Failed to update email." });
  }

  logger.action({ action_name: "update_customer_email", reminder_id: invoiceId as string, user_id: user.id, success: true });
  revalidatePath("/", "layout");
  redirectToDashboard({ success: "Email updated." });
}

// ---------------------------------------------------------------------------
// Delete an invoice
// ---------------------------------------------------------------------------
export async function deleteCustomer(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const invoiceId = formData.get("customer_id");
  if (typeof invoiceId !== "string" || !invoiceId) redirectToDashboard({ error: "Invalid invoice." });

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!);

  if (error) {
    logger.error({ message: "Database error deleting invoice", context: "deleteCustomer", user_id: user.id, error: error.message });
    redirectToDashboard({ error: "Failed to delete customer." });
  }

  logger.action({ action_name: "delete_invoice", reminder_id: invoiceId as string, user_id: user.id, success: true });
  revalidatePath("/", "layout");
  redirectToDashboard({ success: "Customer deleted." });
}

// ---------------------------------------------------------------------------
// Update due date
// ---------------------------------------------------------------------------
export async function updateDueDate(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const invoiceId = formData.get("customer_id");
  if (typeof invoiceId !== "string" || !invoiceId) redirectToDashboard({ error: "Invalid invoice." });

  const rawDate = formData.get("due_date");
  const dueDate = typeof rawDate === "string" && rawDate.trim().length > 0 ? rawDate.trim() : null;

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("invoices")
    .update({ due_date: dueDate })
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!);

  if (error) {
    logger.error({ message: "Database error updating due date", context: "updateDueDate", user_id: user.id, error: error.message });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  logger.action({ action_name: "update_due_date", reminder_id: invoiceId as string, user_id: user.id, success: true });
  revalidatePath("/", "layout");
  redirectToDashboard({ success: dueDate ? `Due date set to ${dueDate}.` : "Due date cleared." });
}

// ---------------------------------------------------------------------------
// Log a manual follow-up
// ---------------------------------------------------------------------------
export async function logFollowUp(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const invoiceId = formData.get("customer_id");
  if (typeof invoiceId !== "string" || !invoiceId) redirectToDashboard({ error: "Invalid invoice." });

  const noteRaw = formData.get("note");
  const note = typeof noteRaw === "string" && noteRaw.trim().length > 0
    ? noteRaw.trim().slice(0, 500)
    : null;

  const supabase = await createSupabaseServerClient();

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("client_id")
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!)
    .maybeSingle<{ client_id: string }>();

  if (fetchError || !invoice) redirectToDashboard({ error: "Invoice not found." });

  await logEvent({
    supabase,
    organizationId: organizationId!,
    invoiceId: invoiceId as string,
    clientId: invoice!.client_id,
    eventType: "followup",
    description: note ?? "Manual follow-up logged.",
  });

  logger.action({ action_name: "log_followup", reminder_id: invoiceId as string, user_id: user.id, success: true });
  revalidatePath("/", "layout");
  redirectToDashboard({ success: "Follow-up logged." });
}

// ---------------------------------------------------------------------------
// Enable automation on an invoice
// ---------------------------------------------------------------------------
export async function enableAutomation(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const invoiceId = getString(formData, "client_id");
  if (!invoiceId) redirectToDashboard({ error: "Invalid invoice." });

  const frequencyRaw = getString(formData, "reminder_frequency_days") ?? "7";
  const frequency = parseInt(frequencyRaw, 10);
  if (!Number.isFinite(frequency) || frequency < 1) redirectToDashboard({ error: "Frequency must be at least 1 day." });

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("invoices")
    .update({ reminders_enabled: true, reminder_frequency_days: frequency, next_send_at: computeFirstReminderSendAt() })
    .eq("id", invoiceId!)
    .eq("organization_id", organizationId!);

  if (error) {
    logger.error({ message: "Database error enabling automation", context: "enableAutomation", user_id: user.id, error: error.message });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  logger.action({ action_name: "enable_automation", reminder_id: invoiceId!, user_id: user.id, success: true });
  revalidatePath("/", "layout");
  revalidatePath(`/customers/${invoiceId}`);
}

// ---------------------------------------------------------------------------
// Delete a payment record
// ---------------------------------------------------------------------------
export async function deletePaymentLog(formData: FormData) {
  const user = await requireUser();

  const logId = formData.get("log_id");
  const invoiceId = formData.get("customer_id");

  if (typeof logId !== "string" || !logId || typeof invoiceId !== "string" || !invoiceId) {
    redirectToDashboard({ error: "Invalid request." });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const supabase = await createSupabaseServerClient();

  // Verify the payment belongs to this org
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("amount")
    .eq("id", logId as string)
    .eq("organization_id", organizationId!)
    .eq("invoice_id", invoiceId as string)
    .single();

  if (paymentError || !payment) redirectToDashboard({ error: "Payment log not found." });

  const { error: deleteError } = await supabase
    .from("payments")
    .delete()
    .eq("id", logId as string)
    .eq("organization_id", organizationId!);

  if (deleteError) redirectToDashboard({ error: "Failed to delete payment log." });

  // Recalculate invoice status based on remaining payments
  const { data: invoice } = await supabase.from("invoices").select("amount").eq("id", invoiceId as string).single();
  const { data: remaining } = await supabase.from("payments").select("amount").eq("invoice_id", invoiceId as string);
  const totalPaid = (remaining ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const newStatus: InvoiceStatus = totalPaid >= Number(invoice?.amount ?? 0) ? "paid" : totalPaid > 0 ? "partial" : "outstanding";

  await supabase.from("invoices").update({ status: newStatus }).eq("id", invoiceId as string).eq("organization_id", organizationId!);

  logger.action({ action_name: "delete_payment_log", reminder_id: invoiceId as string, user_id: user.id, success: true });
  revalidatePath("/", "layout");
  revalidatePath("/customers");
  redirectToDashboard({ success: "Payment log deleted and balance updated." });
}

// ---------------------------------------------------------------------------
// Save internal notes on an invoice
// ---------------------------------------------------------------------------
export async function saveInternalNotes(formData: FormData) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const invoiceId = formData.get("customer_id");
  if (typeof invoiceId !== "string" || !invoiceId) redirectToDashboard({ error: "Invalid invoice." });

  const notes = formData.get("internal_notes");
  const notesValue = typeof notes === "string" && notes.trim().length > 0
    ? notes.trim().slice(0, 2000)
    : null;

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("invoices")
    .update({ internal_notes: notesValue } as Record<string, unknown>)
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!);

  if (error) redirectToDashboard({ error: "Failed to save notes." });

  revalidatePath("/", "layout");
  redirectToDashboard({ success: "Notes saved." });
}

// ---------------------------------------------------------------------------
// Correct amount paid (overwrites payments with a single corrected entry)
// ---------------------------------------------------------------------------
export async function correctAmountPaid(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    redirectToDashboard({ error: getErrorMessage(error, "Please wait a moment and try again.") });
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) redirectToDashboard({ error: "No organization found." });

  const invoiceId = formData.get("customer_id");
  if (typeof invoiceId !== "string" || !invoiceId) redirectToDashboard({ error: "Invalid invoice." });

  const newAmountInput = formData.get("new_amount_paid");
  if (typeof newAmountInput !== "string" || !newAmountInput.trim()) redirectToDashboard({ error: "New amount is required." });

  const newAmountPaid = parseMoney(newAmountInput as string);
  if (newAmountPaid === null || newAmountPaid < 0) redirectToDashboard({ error: "Enter a valid non-negative amount." });

  const supabase = await createSupabaseServerClient();

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("amount, currency")
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!)
    .maybeSingle<{ amount: number; currency: string }>();

  if (fetchError || !invoice) redirectToDashboard({ error: "Invoice not found." });

  const amountOwed = Number(invoice!.amount);
  const paid = newAmountPaid as number;
  const newStatus: InvoiceStatus = paid >= amountOwed ? "paid" : paid > 0 ? "partial" : "outstanding";

  // Delete existing payments and insert a corrected single payment
  await supabase.from("payments").delete().eq("invoice_id", invoiceId as string).eq("organization_id", organizationId!);

  if (paid > 0) {
    await supabase.from("payments").insert({
      organization_id: organizationId!,
      invoice_id: invoiceId as string,
      amount: paid,
      currency: invoice!.currency,
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: "adjustment",
    });
  }

  const { error } = await supabase
    .from("invoices")
    .update({ status: newStatus, ...(newStatus === "paid" ? { reminders_enabled: false } : {}) })
    .eq("id", invoiceId as string)
    .eq("organization_id", organizationId!);

  if (error) {
    logger.error({ message: "Database error correcting amount paid", context: "correctAmountPaid", user_id: user.id, error: error.message });
    redirectToDashboard({ error: "An unexpected error occurred." });
  }

  logger.action({ action_name: "correct_amount_paid", reminder_id: invoiceId as string, user_id: user.id, success: true });
  revalidatePath("/", "layout");
  redirectToDashboard({
    success: newStatus === "paid"
      ? "Amount corrected — invoice is now fully paid."
      : `Amount corrected — ${paid.toFixed(2)} recorded.`,
  });
}
