"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const cache_1 = require("next/cache");
const navigation_1 = require("next/navigation");
const auth_1 = require("@/lib/auth");
const server_1 = require("@/lib/supabase/server");
/**
 * Helper to get the organization_id for the current user.
 * All data access must be scoped to an organization.
 */
async function getOrganizationId(userId) {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .maybeSingle();
    return data?.organization_id ?? null;
}
async function createClient(formData) {
    const user = await (0, auth_1.requireUser)();
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId) {
        (0, navigation_1.redirect)("/customers/new?error=" + encodeURIComponent("No organization found. Please contact support."));
    }
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const name = formData.get("name")?.trim();
    const email = formData.get("email")?.trim() || null;
    const company_name = formData.get("company_name")?.trim() || null;
    if (!name) {
        (0, navigation_1.redirect)("/customers/new?error=" + encodeURIComponent("Customer name is required"));
    }
    const { data, error } = await supabase
        .from("clients")
        .insert({
        organization_id: organizationId,
        name,
        email: email ?? "",
        company_name,
    })
        .select("id")
        .single();
    if (error) {
        console.error("Failed to create client:", error);
        (0, navigation_1.redirect)("/customers/new?error=" + encodeURIComponent(error.message));
    }
    (0, cache_1.revalidatePath)("/customers");
    (0, navigation_1.redirect)(`/customers/${data.id}`);
}
