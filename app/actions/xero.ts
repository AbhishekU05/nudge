"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { XeroClient } from "xero-node";
import { XeroIntegrationRow } from "@/lib/xero";
import { logger } from "@/lib/logger";

async function getOrganizationId(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .single();
  return data?.organization_id ?? null;
}

export async function getXeroBankAccounts() {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);
  
  if (!organizationId) return [];

  const supabase = await createSupabaseServerClient();
  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", "xero")
    .maybeSingle<XeroIntegrationRow>();

  if (!integration) return [];

  try {
    const xero = new XeroClient();
    xero.setTokenSet({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expires_at: Math.floor(new Date(integration.expires_at).getTime() / 1000),
    });

    if (new Date(integration.expires_at).getTime() - Date.now() <= 5 * 60 * 1000) {
      await xero.refreshToken();
    }

    const accountsResponse = await xero.accountingApi.getAccounts(
      integration.tenant_id,
      undefined,
      'Type=="BANK"'
    );
    
    return (accountsResponse.body.accounts || [])
      .filter(a => String(a.status) === "ACTIVE" && a.accountID && a.name)
      .map(a => ({
        id: a.accountID as string,
        name: a.name as string,
      }));
  } catch (error) {
    logger.error({ 
      message: "Failed to fetch Xero bank accounts for dropdown", 
      context: "getXeroBankAccounts",
      organization_id: organizationId,
      error
    });
    return [];
  }
}
