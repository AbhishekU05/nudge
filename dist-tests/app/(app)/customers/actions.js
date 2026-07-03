"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGroup = createGroup;
exports.updateGroup = updateGroup;
exports.deleteGroup = deleteGroup;
exports.toggleCustomerGroup = toggleCustomerGroup;
const cache_1 = require("next/cache");
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
async function createGroup(data) {
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { error } = await supabase.from("groups").insert({
        user_id: user.id,
        name: data.name,
        description: data.description || null,
        color: data.color || null,
    });
    if (error) {
        throw new Error(error.message);
    }
    (0, cache_1.revalidatePath)("/customers");
    return { success: true };
}
async function updateGroup(id, data) {
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { error } = await supabase
        .from("groups")
        .update(data)
        .eq("id", id)
        .eq("user_id", user.id);
    if (error) {
        throw new Error(error.message);
    }
    (0, cache_1.revalidatePath)("/customers");
    return { success: true };
}
async function deleteGroup(id) {
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
    if (error) {
        throw new Error(error.message);
    }
    (0, cache_1.revalidatePath)("/customers");
    return { success: true };
}
async function toggleCustomerGroup(customerId, groupId, assign) {
    const user = await (0, auth_1.requireUser)();
    const supabase = await (0, server_1.createSupabaseServerClient)();
    // Ensure the group belongs to the user
    const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id")
        .eq("id", groupId)
        .eq("user_id", user.id)
        .single();
    if (groupError || !group) {
        throw new Error("Group not found or access denied");
    }
    if (assign) {
        // Enforce one group per customer by removing existing mappings first
        await supabase.from("customer_groups").delete().eq("customer_id", customerId);
        const { error } = await supabase.from("customer_groups").insert({
            customer_id: customerId,
            group_id: groupId,
        });
        if (error && error.code !== "23505") { // Ignore unique violation if already assigned
            throw new Error(error.message);
        }
    }
    else {
        const { error } = await supabase
            .from("customer_groups")
            .delete()
            .eq("customer_id", customerId)
            .eq("group_id", groupId);
        if (error) {
            throw new Error(error.message);
        }
    }
    (0, cache_1.revalidatePath)("/customers");
    return { success: true };
}
