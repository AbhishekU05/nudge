"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { inngest } from "@/lib/inngest/client";
import { logger } from "@/lib/logger";
import { LateFeePolicy } from "@/lib/types";

async function triggerLateFeeReevaluation(organizationId: string, supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer U> ? U : never) {
  // 1. Cancel all sleeping workflows for this org
  await inngest.send({ name: "policy.updated", data: { organizationId } });

  // 2. Fetch all unpaid invoices and start a new workflow for each
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id")
    .eq("organization_id", organizationId)
    .not("status", "in", '("paid","written_off")');

  if (invoices && invoices.length > 0) {
    const events = invoices.map((inv: { id: string }) => ({
      name: "invoice.evaluate_late_fee",
      data: { invoiceId: inv.id, organizationId }
    }));
    
    // Inngest send allows arrays
    await inngest.send(events);
  }
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

export async function createLateFeePolicy(formData: FormData) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) throw new Error("No organization found.");

  const supabase = await createSupabaseServerClient();

  const name = formData.get("name") as string;
  const fee_type = formData.get("fee_type") as "flat" | "percentage";
  const fee_value = Number(formData.get("fee_value"));
  const grace_period_days = Number(formData.get("grace_period_days"));
  const due_days = Number(formData.get("due_days"));
  const frequency = formData.get("frequency") as "once" | "weekly" | "monthly";
  const included_group_ids = formData.getAll("included_group_ids") as string[];
  const auto_approve = formData.get("auto_approve") === "true";
  const tax_treatment =
    (formData.get("tax_treatment") as "no_tax" | "exclusive" | "inclusive") || "no_tax";

  // A policy with no target groups matches no invoice (see late-fee-workflow.ts),
  // so an empty selection is never a valid save.
  if (included_group_ids.length === 0) {
    throw new Error("Select at least one group (or \"No group\") for this policy to apply to.");
  }

  const { data, error } = await supabase
    .from("late_fee_policies")
    .insert({
      organization_id: organizationId,
      name,
      fee_type,
      fee_value,
      grace_period_days,
      due_days,
      frequency,
      included_group_ids,
      auto_approve,
      tax_treatment,
      active: true,
    })
    .select()
    .single();

  if (error) {
    logger.error({ message: "Failed to create late fee policy", context: "createLateFeePolicy", error: error.message });
    throw new Error(`Failed to create late fee policy: ${error.message}`);
  }

  await triggerLateFeeReevaluation(organizationId, supabase);

  revalidatePath("/settings/late-fees");

  return data as LateFeePolicy;
}

export async function updateLateFeePolicy(id: string, formData: FormData) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) throw new Error("No organization found.");

  const supabase = await createSupabaseServerClient();

  const name = formData.get("name") as string;
  const fee_type = formData.get("fee_type") as "flat" | "percentage";
  const fee_value = Number(formData.get("fee_value"));
  const grace_period_days = Number(formData.get("grace_period_days"));
  const due_days = Number(formData.get("due_days"));
  const frequency = formData.get("frequency") as "once" | "weekly" | "monthly";
  const included_group_ids = formData.getAll("included_group_ids") as string[];
  const auto_approve = formData.get("auto_approve") === "true";
  const tax_treatment =
    (formData.get("tax_treatment") as "no_tax" | "exclusive" | "inclusive") || "no_tax";

  // A policy with no target groups matches no invoice (see late-fee-workflow.ts),
  // so an empty selection is never a valid save.
  if (included_group_ids.length === 0) {
    throw new Error("Select at least one group (or \"No group\") for this policy to apply to.");
  }

  const { data, error } = await supabase
    .from("late_fee_policies")
    .update({ name, fee_type, fee_value, grace_period_days, due_days, frequency, included_group_ids, auto_approve, tax_treatment })
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    logger.error({ message: "Failed to update late fee policy", context: "updateLateFeePolicy", error: error.message });
    throw new Error(`Failed to update late fee policy: ${error.message}`);
  }

  await triggerLateFeeReevaluation(organizationId, supabase);

  revalidatePath("/settings/late-fees");

  return data as LateFeePolicy;
}

export async function toggleLateFeePolicyActive(id: string, active: boolean) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) throw new Error("No organization found.");

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("late_fee_policies")
    .update({ active })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Failed to toggle late fee policy", error);
    throw new Error("Failed to toggle late fee policy");
  }

  // Invoices that were already evaluated while this policy was inactive
  // exited their workflow with "no active policies" and nothing is watching
  // them anymore. Re-evaluating on activation is what picks them back up;
  // on deactivation, sleeping workflows already re-check policy.active
  // (lib/inngest/functions/late-fee-workflow.ts) right before applying a fee,
  // so no eager cancellation is needed there.
  if (active) {
    await triggerLateFeeReevaluation(organizationId, supabase);
  }

  revalidatePath("/settings/late-fees");
}

export async function deleteLateFeePolicy(id: string) {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  if (!organizationId) throw new Error("No organization found.");

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("late_fee_policies")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Failed to delete late fee policy", error);
    throw new Error("Failed to delete late fee policy");
  }

  revalidatePath("/settings/late-fees");
}
