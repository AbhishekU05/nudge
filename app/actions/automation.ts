"use server";

import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/abuse";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeFirstReminderSendAt, computeRecurringReminderSendAt } from "@/lib/reminder-schedule";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

export async function saveAutomationSettings(formData: FormData) {
  const user = await requireUser();

  try {
    await enforceRateLimit(user.id, "reminder_toggle");
  } catch (error) {
    throw new Error("Please wait a moment and try again.");
  }

  const entityType = formData.get("entity_type") as "client" | "invoice";
  const entityId = formData.get("entity_id") as string;
  const autoApprove = formData.get("auto_approve") === "true";
  const reminderType = formData.get("reminder_type") as "recurring" | "sequence";
  const newEmail = formData.get("new_email") as string | null;
  const emailField = entityType === "client" ? "email" : "recipient_email";
  
  // Parse templates
  const templatesRaw = formData.get("reminder_templates") as string;
  let reminderTemplates;
  try {
    reminderTemplates = JSON.parse(templatesRaw);
  } catch (e) {
    throw new Error("Invalid templates data");
  }

  const supabase = await createSupabaseServerClient();
  const table = entityType === "client" ? "clients" : "invoices";

  // Get current state to compute next_send_at
  const { data: entity, error: fetchError } = await supabase
    .from(table)
    .select("last_sent_at, active")
    .eq("id", entityId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !entity) {
    throw new Error(`${entityType} not found.`);
  }

  // Calculate frequency based on first template if recurring, or default to 7
  let frequency = 7;
  if (reminderType === "recurring" && reminderTemplates.length > 0 && reminderTemplates[0].days_offset) {
    frequency = reminderTemplates[0].days_offset;
  }

  // Only update next_send_at if we're turning it from inactive to active, or if it's already active and we're changing frequency.
  // Actually, let's just keep next_send_at if it's already active, or schedule it if newly active.
  let nextSendAt = undefined;
  if (!entity.active) {
    nextSendAt = entity.last_sent_at 
      ? computeRecurringReminderSendAt(frequency) 
      : computeFirstReminderSendAt();
  }

  const { error } = await supabase
    .from(table)
    .update({
      active: true,
      auto_approve: autoApprove,
      reminder_type: reminderType,
      reminder_templates: reminderTemplates,
      reminder_frequency_days: frequency,
      ...(nextSendAt !== undefined && { next_send_at: nextSendAt }),
      ...(newEmail && { [emailField]: newEmail }),
      sequence_index: 0, // Reset sequence when settings change
    })
    .eq("id", entityId)
    .eq("user_id", user.id);

  if (error) {
    logger.error({
      message: "Database error saving automation settings",
      context: "saveAutomationSettings",
      user_id: user.id,
      error: error.message,
    });
    throw new Error("An unexpected error occurred while saving.");
  }

  // If a new email was provided, synchronize it between client and invoices
  if (newEmail) {
    if (entityType === "client") {
      // Update all invoices belonging to this client to use the new email
      await supabase
        .from("invoices")
        .update({ recipient_email: newEmail })
        .eq("customer_id", entityId)
        .eq("user_id", user.id);
    } else {
      // Update the client associated with this invoice to use the new email
      const { data: invoice } = await supabase
        .from("invoices")
        .select("customer_id")
        .eq("id", entityId)
        .single();
        
      if (invoice?.customer_id) {
        await supabase
          .from("clients")
          .update({ email: newEmail })
          .eq("id", invoice.customer_id)
          .eq("user_id", user.id);
          
        // Also update all other invoices belonging to this client to ensure sync
        await supabase
          .from("invoices")
          .update({ recipient_email: newEmail })
          .eq("customer_id", invoice.customer_id)
          .eq("user_id", user.id);
      }
    }
  }

  revalidatePath(`/customers/${entityId}`);
  revalidatePath(`/invoices/${entityId}`);
  revalidatePath("/customers");
  revalidatePath("/invoices");
  return { success: true };
}

export async function pauseAutomation(entityType: "client" | "invoice", entityId: string) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const table = entityType === "client" ? "clients" : "invoices";

  const { error } = await supabase
    .from(table)
    .update({
      active: false,
      next_send_at: null,
    })
    .eq("id", entityId)
    .eq("user_id", user.id);

  if (error) throw new Error("Failed to pause automation");
  
  revalidatePath(entityType === "client" ? `/customers/${entityId}` : `/invoices/${entityId}`);
}
