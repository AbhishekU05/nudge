import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  OrgMemberRole,
  PricingPlanType,
  SubscriptionStatus,
} from "@/lib/types";

export type OrganizationBilling = {
  id: string;
  name: string;
  domain: string | null;
  role: OrgMemberRole;
  dodo_customer_id: string | null;
  dodo_subscription_id: string | null;
  dodo_subscription_status: SubscriptionStatus | null;
  dodo_next_billing_date: string | null;
  plan_type: PricingPlanType | null;
  credits_balance: number;
};

/**
 * Resolves the user's workspace and billing state. The application currently has
 * no active-workspace selector, so multiple memberships are rejected rather than
 * risking a charge against the wrong organization.
 */
export async function getOrganizationBillingForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<OrganizationBilling | null> {
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .maybeSingle<{
      organization_id: string;
      role: OrgMemberRole;
    }>();

  if (membershipError) {
    throw new Error(`Unable to resolve organization membership: ${membershipError.message}`);
  }

  let activeMembership = membership;

  if (!activeMembership) {
    // Auto-provision a workspace for this user (e.g., they signed up via OAuth which skips the standard signup flow)
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
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
    
    let orgIdToJoin: string | null = null;
    let roleToAssign: OrgMemberRole = "owner";

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
      orgIdToJoin = newOrg!.id;
    }

    const { error: insertMemberError } = await adminSupabase.from("organization_members").insert({
      organization_id: orgIdToJoin,
      user_id: userId,
      role: roleToAssign,
    });

    if (insertMemberError) {
      throw new Error(`Unable to join organization: ${insertMemberError.message}`);
    }

    activeMembership = { organization_id: orgIdToJoin as string, role: roleToAssign };
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select(
      "id, name, domain, dodo_customer_id, dodo_subscription_id, dodo_subscription_status, dodo_next_billing_date, plan_type, credits_balance",
    )
    .eq("id", activeMembership!.organization_id)
    .single<{
      id: string;
      name: string;
      domain: string | null;
      dodo_customer_id: string | null;
      dodo_subscription_id: string | null;
      dodo_subscription_status: SubscriptionStatus | null;
      dodo_next_billing_date: string | null;
      plan_type: PricingPlanType | null;
      credits_balance: number | null;
    }>();

  if (organizationError) {
    throw new Error(`Unable to load organization billing: ${organizationError.message}`);
  }

  return {
    ...organization,
    role: activeMembership!.role,
    credits_balance: organization.credits_balance ?? 0,
  };
}

export function canManageOrganizationBilling(role: OrgMemberRole): boolean {
  return role === "owner" || role === "admin";
}
