"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { XeroIntegrationRow, withXeroRetry } from "@/lib/xero";
import { logger } from "@/lib/logger";

export type XeroBankAccount = { id: string; name: string };

export type XeroBankAccountsResult =
  | { ok: true; accounts: XeroBankAccount[] }
  | { ok: false; error: string };

async function getOrganizationId(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .single();
  return data?.organization_id ?? null;
}

export async function getXeroBankAccounts(): Promise<XeroBankAccountsResult> {
  const user = await requireUser();
  const organizationId = await getOrganizationId(user.id);

  if (!organizationId) return { ok: true, accounts: [] };

  const supabase = await createSupabaseServerClient();
  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", "xero")
    .maybeSingle<XeroIntegrationRow>();

  if (!integration) return { ok: true, accounts: [] };

  try {
    const { result: accounts } = await withXeroRetry(integration, async (xero, current) => {
      const accountsResponse = await xero.accountingApi.getAccounts(
        current.tenant_id,
        undefined,
        'Type=="BANK"'
      );
      return accountsResponse.body.accounts || [];
    });

    return {
      ok: true,
      accounts: accounts
        .filter(a => String(a.status) === "ACTIVE" && a.accountID && a.name)
        .map(a => ({
          id: a.accountID as string,
          name: a.name as string,
        })),
    };
  } catch (error) {
    logger.error({
      message: "Failed to fetch Xero bank accounts for dropdown",
      context: "getXeroBankAccounts",
      organization_id: organizationId,
      error
    });
    return { ok: false, error: "Couldn't load bank accounts from Xero." };
  }
}
