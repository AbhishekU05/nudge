"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationBillingForUser = getOrganizationBillingForUser;
exports.canManageOrganizationBilling = canManageOrganizationBilling;
require("server-only");
/**
 * Resolves the user's workspace and billing state. The application currently has
 * no active-workspace selector, so multiple memberships are rejected rather than
 * risking a charge against the wrong organization.
 */
async function getOrganizationBillingForUser(supabase, userId) {
    const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", userId)
        .maybeSingle();
    if (membershipError) {
        throw new Error(`Unable to resolve organization membership: ${membershipError.message}`);
    }
    let activeMembership = membership;
    if (!activeMembership) {
        // Auto-provision a workspace for this user (e.g., they signed up via OAuth which skips the standard signup flow)
        const { createSupabaseAdminClient } = await Promise.resolve().then(() => __importStar(require("@/lib/supabase/admin")));
        const adminSupabase = createSupabaseAdminClient();
        // Get user email
        const { data: { user: authUser } } = await adminSupabase.auth.admin.getUserById(userId);
        const email = authUser?.email || "";
        // Get user profile
        const { data: profile } = await adminSupabase.from("profiles").select("full_name").eq("user_id", userId).maybeSingle();
        const fullName = profile?.full_name || "User";
        const domain = email.split("@")[1]?.toLowerCase();
        const PERSONAL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com"];
        const isPersonal = domain ? PERSONAL_DOMAINS.includes(domain) : true;
        let orgIdToJoin = null;
        let roleToAssign = "owner";
        if (!isPersonal && domain) {
            // Check if company workspace exists
            const { data: existingOrg } = await adminSupabase.from("organizations").select("id").eq("domain", domain).maybeSingle();
            if (existingOrg) {
                orgIdToJoin = existingOrg.id;
                roleToAssign = "member";
            }
        }
        if (!orgIdToJoin) {
            // Create new workspace
            const { data: newOrg, error: createOrgError } = await adminSupabase
                .from("organizations")
                .insert({ name: `${fullName}'s Workspace`, domain: (!isPersonal && domain) ? domain : null })
                .select("id")
                .single();
            if (createOrgError) {
                throw new Error(`Unable to auto-provision organization: ${createOrgError.message}`);
            }
            orgIdToJoin = newOrg.id;
        }
        const { error: insertMemberError } = await adminSupabase.from("organization_members").insert({
            organization_id: orgIdToJoin,
            user_id: userId,
            role: roleToAssign,
        });
        if (insertMemberError) {
            throw new Error(`Unable to join organization: ${insertMemberError.message}`);
        }
        activeMembership = { organization_id: orgIdToJoin, role: roleToAssign };
    }
    const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("id, name, domain, dodo_customer_id, dodo_subscription_id, dodo_subscription_status, plan_type, credits_balance")
        .eq("id", activeMembership.organization_id)
        .single();
    if (organizationError) {
        throw new Error(`Unable to load organization billing: ${organizationError.message}`);
    }
    return {
        ...organization,
        role: activeMembership.role,
        credits_balance: organization.credits_balance ?? 0,
    };
}
function canManageOrganizationBilling(role) {
    return role === "owner" || role === "admin";
}
