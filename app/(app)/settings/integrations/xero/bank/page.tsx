import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Container } from "@/components/site/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import Link from "next/link";
import { XeroIntegrationRow, withXeroRetry } from "@/lib/xero";

export default async function XeroBankSelectionPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    redirect("/settings/integrations");
  }

  const { data: integration, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("organization_id", member.organization_id)
    .eq("provider", "xero")
    .maybeSingle<XeroIntegrationRow>();

  if (error || !integration) {
    redirect("/settings/integrations");
  }

  let bankAccounts: import("xero-node").Account[] = [];
  let loadFailed = false;
  try {
    const { result: accounts } = await withXeroRetry(integration, async (xero, current) => {
      const accountsResponse = await xero.accountingApi.getAccounts(
        current.tenant_id,
        undefined,
        'Type=="BANK"'
      );
      return accountsResponse.body.accounts || [];
    });
    bankAccounts = accounts.filter(a => String(a.status) === "ACTIVE");
  } catch (e) {
    loadFailed = true;
    logger.error({
      message: "Failed to fetch Xero bank accounts",
      context: "xero:bank_accounts",
      user_id: user.id,
      error: e
    });
  }

  async function selectAccount(formData: FormData) {
    "use server";
    
    // We already have user and member here, but we should verify server-side context if needed.
    const accountId = formData.get("account_id") as string;
    const accountName = formData.get("account_name") as string;
    
    const supabaseAction = await createSupabaseServerClient();
    await supabaseAction
      .from("integrations")
      .update({ xero_default_account_id: accountId, xero_default_account_name: accountName })
      .eq("organization_id", member!.organization_id)
      .eq("provider", "xero");
      
    redirect("/settings/integrations");
  }

  return (
    <Container className="py-12 max-w-2xl mx-auto">
      <Card className="bg-white/[0.025] border-white/10">
        <CardHeader>
          <CardTitle className="text-xl">Select Default Xero Bank Account</CardTitle>
          <CardDescription>
            Choose the default bank account where Duely should record automated payments (like client portal payments) sent to Xero.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadFailed ? (
            <div className="text-sm text-zinc-400 py-4">
              <p className="text-amber-400">We couldn&apos;t reach Xero to load your bank accounts.</p>
              <p className="mt-1">
                This is a connection problem on our side, not a problem with your Xero
                organization. Try again in a moment.
              </p>
              <div className="mt-4 flex gap-2">
                <Link href="/settings/integrations/xero/bank">
                  <Button variant="secondary">Try again</Button>
                </Link>
                <Link href="/settings/integrations">
                  <Button variant="ghost">Return to Integrations</Button>
                </Link>
              </div>
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="text-sm text-zinc-400 py-4">
              No active bank accounts found in your Xero organization. Please add one in Xero first.
              <div className="mt-4">
                <Link href="/settings/integrations">
                  <Button variant="secondary">Return to Integrations</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <form key={account.accountID} action={selectAccount}>
                  <input type="hidden" name="account_id" value={account.accountID} />
                  <input type="hidden" name="account_name" value={account.name} />
                  <button
                    type="submit"
                    className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-medium text-zinc-200">{account.name}</p>
                      <p className="text-sm text-zinc-500 mt-1">
                        {account.bankAccountNumber ? `Account: ****${account.bankAccountNumber.slice(-4)}` : 'Bank Account'}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Select
                    </div>
                  </button>
                </form>
              ))}
              
              <div className="pt-4 border-t border-white/10 mt-6 flex justify-end">
                <Link href="/settings/integrations">
                  <Button variant="ghost">Cancel</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
