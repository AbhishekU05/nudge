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

  const entityType = formData.get("entity_type") as "client" | "invoice";
  const entityId = formData.get("entity_id") as string;
  const newEmail = formData.get("new_email") as string | null;
  const reminderFrequencyDays = Number(formData.get("reminder_frequency_days") ?? 7);
  const reminderType = formData.get("reminder_type") as string || "recurring";
  
  let reminderTemplates = [];
  try {
    const parsed = JSON.parse(formData.get("reminder_templates") as string || "[]");
    reminderTemplates = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    reminderTemplates = [];
  }

  const supabase = await createSupabaseServerClient();

  if (entityType === "invoice") {
    // INVOICE LEVEL AUTOMATION
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("next_send_at, reminders_enabled")
      .eq("id", entityId)
      .eq("organization_id", organizationId)
      .single();

    if (fetchError || !invoice) throw new Error("Invoice not found.");

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
        reminder_type: reminderType,
        reminder_templates: reminderTemplates,
        ...(nextSendAt !== undefined && { next_send_at: nextSendAt }),
      })
      .eq("id", entityId)
      .eq("organization_id", organizationId);

    if (error) throw new Error("An unexpected error occurred while saving.");

    if (newEmail) {
      const { data: inv } = await supabase.from("invoices").select("client_id").eq("id", entityId).single();
      if (inv?.client_id) {
        await supabase.from("clients").update({ email: newEmail }).eq("id", inv.client_id).eq("organization_id", organizationId);
      }
    }

    revalidatePath(`/invoices/${entityId}`);
    revalidatePath("/invoices");

  } else if (entityType === "client") {
    // CLIENT LEVEL AUTOMATION
    const { data: client, error: fetchError } = await supabase
      .from("clients")
      .select("next_send_at, active")
      .eq("id", entityId)
      .eq("organization_id", organizationId)
      .single();

    if (fetchError || !client) throw new Error("Client not found.");

    let nextSendAt = undefined;
    if (!client.active) {
      nextSendAt = client.next_send_at
        ? computeRecurringReminderSendAt(reminderFrequencyDays)
        : computeFirstReminderSendAt();
    }

    const { error } = await supabase
      .from("clients")
      .update({
        active: true,
        reminder_frequency_days: reminderFrequencyDays,
        reminder_type: reminderType,
        reminder_templates: reminderTemplates,
        ...(newEmail && { email: newEmail }),
        ...(nextSendAt !== undefined && { next_send_at: nextSendAt }),
      })
      .eq("id", entityId)
      .eq("organization_id", organizationId);

    if (error) throw new Error("An unexpected error occurred while saving.");

    revalidatePath(`/customers/${entityId}`);
    revalidatePath("/customers");
  }

  return { success: true };
}

export async function pauseAutomation(entityType: "client" | "invoice", entityId: string) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) throw new Error("No organization found.");

  const supabase = await createSupabaseServerClient();

  if (entityType === "invoice") {
    const { error } = await supabase
      .from("invoices")
      .update({
        reminders_enabled: false,
        next_send_at: null,
      })
      .eq("id", entityId)
      .eq("organization_id", organizationId);

    if (error) throw new Error("Failed to pause automation");
    revalidatePath(`/invoices/${entityId}`);
  } else if (entityType === "client") {
    const { error } = await supabase
      .from("clients")
      .update({
        active: false,
        next_send_at: null,
      })
      .eq("id", entityId)
      .eq("organization_id", organizationId);

    if (error) throw new Error("Failed to pause automation");
    revalidatePath(`/customers/${entityId}`);
  }
}
