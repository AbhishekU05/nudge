"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLateFeePolicy = createLateFeePolicy;
exports.updateLateFeePolicy = updateLateFeePolicy;
exports.toggleLateFeePolicyActive = toggleLateFeePolicyActive;
exports.deleteLateFeePolicy = deleteLateFeePolicy;
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
const cache_1 = require("next/cache");
async function getOrganizationId(userId) {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .maybeSingle();
    return data?.organization_id ?? null;
}
async function createLateFeePolicy(formData) {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        throw new Error("No organization found.");
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const name = formData.get("name");
    const fee_type = formData.get("fee_type");
    const fee_value = Number(formData.get("fee_value"));
    const grace_period_days = Number(formData.get("grace_period_days"));
    const frequency = formData.get("frequency");
    const apply_to = formData.get("apply_to");
    const excluded_group_ids = formData.getAll("excluded_group_ids");
    const { error } = await supabase.from("late_fee_policies").insert({
        organization_id: organizationId,
        name,
        fee_type,
        fee_value,
        grace_period_days,
        frequency,
        apply_to,
        excluded_group_ids,
        active: true,
    });
    if (error) {
        console.error("Failed to create late fee policy", error);
        throw new Error("Failed to create late fee policy");
    }
    (0, cache_1.revalidatePath)("/settings/late-fees");
}
async function updateLateFeePolicy(id, formData) {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        throw new Error("No organization found.");
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const name = formData.get("name");
    const fee_type = formData.get("fee_type");
    const fee_value = Number(formData.get("fee_value"));
    const grace_period_days = Number(formData.get("grace_period_days"));
    const frequency = formData.get("frequency");
    const apply_to = formData.get("apply_to");
    const excluded_group_ids = formData.getAll("excluded_group_ids");
    const { error } = await supabase
        .from("late_fee_policies")
        .update({ name, fee_type, fee_value, grace_period_days, frequency, apply_to, excluded_group_ids })
        .eq("id", id)
        .eq("organization_id", organizationId);
    if (error) {
        console.error("Failed to update late fee policy", error);
        throw new Error("Failed to update late fee policy");
    }
    (0, cache_1.revalidatePath)("/settings/late-fees");
}
async function toggleLateFeePolicyActive(id, active) {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        throw new Error("No organization found.");
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { error } = await supabase
        .from("late_fee_policies")
        .update({ active })
        .eq("id", id)
        .eq("organization_id", organizationId);
    if (error) {
        console.error("Failed to toggle late fee policy", error);
        throw new Error("Failed to toggle late fee policy");
    }
    (0, cache_1.revalidatePath)("/settings/late-fees");
}
async function deleteLateFeePolicy(id) {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId)
        throw new Error("No organization found.");
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { error } = await supabase
        .from("late_fee_policies")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);
    if (error) {
        console.error("Failed to delete late fee policy", error);
        throw new Error("Failed to delete late fee policy");
    }
    (0, cache_1.revalidatePath)("/settings/late-fees");
}
