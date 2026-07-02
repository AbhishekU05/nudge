"use server";

import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/abuse";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeFirstReminderSendAt, computeRecurringReminderSendAt } from "@/lib/reminder-schedule";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

async function getOrganizationId(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.organization_id ?? null;
}

export async function saveAutomationSettings(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch {
    throw new Error("Please wait a moment and try again.");
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) throw new Error("No organization found.");

  const invoiceId = formData.get("entity_id") as string;
  const newEmail = formData.get("new_email") as string | null;
  const reminderFrequencyDays = Number(formData.get("reminder_frequency_days") ?? 7);

  const supabase = await createSupabaseServerClient();

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
      ? computeRecurringReminderSendAt(reminderFrequencyDays)
      : computeFirstReminderSendAt();
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
    logger.error({
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

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  return { success: true };
}

export async function pauseAutomation(entityType: "client" | "invoice", invoiceId: string) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) throw new Error("No organization found.");

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("invoices")
    .update({
      reminders_enabled: false,
      next_send_at: null,
    })
    .eq("id", invoiceId)
    .eq("organization_id", organizationId);

  if (error) throw new Error("Failed to pause automation");

  revalidatePath(`/invoices/${invoiceId}`);
}
