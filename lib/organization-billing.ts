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

  if (!membership) return null;

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select(
      "id, name, domain, dodo_customer_id, dodo_subscription_id, dodo_subscription_status, plan_type, credits_balance",
    )
    .eq("id", membership.organization_id)
    .single<{
      id: string;
      name: string;
      domain: string | null;
      dodo_customer_id: string | null;
      dodo_subscription_id: string | null;
      dodo_subscription_status: SubscriptionStatus | null;
      plan_type: PricingPlanType | null;
      credits_balance: number | null;
    }>();

  if (organizationError) {
    throw new Error(`Unable to load organization billing: ${organizationError.message}`);
  }

  return {
    ...organization,
    role: membership.role,
    credits_balance: organization.credits_balance ?? 0,
  };
}

export function canManageOrganizationBilling(role: OrgMemberRole): boolean {
  return role === "owner" || role === "admin";
}
