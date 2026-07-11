"use server";

import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/abuse";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeFirstReminderSendAt, computeRecurringReminderSendAt } from "@/lib/reminder-schedule";
import { revalidatePath } from "next/cache";
import { inngest } from "@/lib/inngest/client";

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
    await enforceRateLimit(user.id, "external_sync_action");
  } catch {
    throw new Error("Please wait a moment and try again.");
  }

  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) throw new Error("No organization found.");

  const entityType = formData.get("entity_type") as "client" | "invoice";
  const entityId = formData.get("entity_id") as string;
  const newEmail = formData.get("new_email") as string | null;

  if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    throw new Error("Please provide a valid email address.");
  }

  const reminderFrequencyDays = Number(formData.get("reminder_frequency_days") ?? 7);
  const reminderType = formData.get("reminder_type") as string || "recurring";
  const autoApproveStr = formData.get("auto_approve");
  const autoApprove = autoApproveStr === "true";
  
  let reminderTemplates = [];
  try {
    const parsed = JSON.parse(formData.get("reminder_templates") as string || "[]");
    reminderTemplates = Array.isArray(parsed) ? parsed : [];
  } catch {
    reminderTemplates = [];
  }

  const supabase = await createSupabaseServerClient();

  if (entityType === "invoice") {
    // INVOICE LEVEL AUTOMATION
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("next_send_at, reminders_enabled, due_date, clients(email)")
      .eq("id", entityId)
      .eq("organization_id", organizationId)
      .single();

    if (fetchError || !invoice) throw new Error("Invoice not found.");

    const clientData = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
    const existingEmail = clientData?.email;
    if (!newEmail && !existingEmail) {
      throw new Error("An email address is required to enable automation.");
    }

    let nextSendAt = undefined;
    if (!invoice.reminders_enabled) {
      if (invoice.next_send_at) {
        nextSendAt = computeRecurringReminderSendAt(reminderFrequencyDays);
      } else {
        const firstOffset = reminderType === "sequence" ? (reminderTemplates[0]?.days_offset || 7) : undefined;
        nextSendAt = computeFirstReminderSendAt(new Date(), invoice.due_date, firstOffset);
      }
    }

    const { error } = await supabase
      .from("invoices")
      .update({
        reminders_enabled: true,
        reminder_frequency_days: reminderFrequencyDays,
        reminder_type: reminderType,
        reminder_templates: reminderTemplates,
        auto_approve: autoApprove,
        // Only reset when actually transitioning disabled -> enabled (the
        // same condition that computes a "first send" schedule above) - a
        // fresh schedule paired with a stale mid-sequence index would jump
        // straight to a later template instead of starting over. Editing
        // settings on an already-active automation leaves both alone, so
        // the client doesn't get a repeat of a template they already saw.
        ...(nextSendAt !== undefined && { next_send_at: nextSendAt, sequence_index: 0 }),
      })
      .eq("id", entityId)
      .eq("organization_id", organizationId);

    if (error) throw new Error("An unexpected error occurred while saving.");

    // Fire Inngest event to start or restart the sleeping workflow
    await inngest.send({
      name: "automation.enabled",
      data: { entityId, entityType: "invoice", organizationId },
    });

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
      .select("next_send_at, active, email")
      .eq("id", entityId)
      .eq("organization_id", organizationId)
      .single();

    if (fetchError || !client) throw new Error("Client not found.");

    if (!newEmail && !client.email) {
      throw new Error("An email address is required to enable automation.");
    }

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
        auto_approve: autoApprove,
        ...(newEmail && { email: newEmail }),
        // See the matching comment in the invoice branch above.
        ...(nextSendAt !== undefined && { next_send_at: nextSendAt, sequence_index: 0 }),
      })
      .eq("id", entityId)
      .eq("organization_id", organizationId);

    if (error) throw new Error("An unexpected error occurred while saving.");

    // Fire Inngest event to start or restart the sleeping workflow
    await inngest.send({
      name: "automation.enabled",
      data: { entityId, entityType: "client", organizationId },
    });

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

    await inngest.send({
      name: "automation.disabled",
      data: { entityId },
    });

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

    await inngest.send({
      name: "automation.disabled",
      data: { entityId, entityType: "client", organizationId },
    });

    revalidatePath(`/customers/${entityId}`);
  }

  return { success: true };
}
