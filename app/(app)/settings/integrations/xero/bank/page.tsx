import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { XeroClient } from "xero-node";
import { redirect } from "next/navigation";
import { Container } from "@/components/site/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import Link from "next/link";

export default async function XeroBankSelectionPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: integration, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "xero")
    .maybeSingle();

  if (error || !integration) {
    redirect("/settings/integrations");
  }

  let bankAccounts: any[] = [];
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
    bankAccounts = accountsResponse.body.accounts?.filter(a => String(a.status) === "ACTIVE") || [];
  } catch (e) {
    logger.error({ message: "Failed to fetch Xero bank accounts", error: e });
  }

  async function selectAccount(formData: FormData) {
    "use server";
    const accountId = formData.get("account_id") as string;
    const accountName = formData.get("account_name") as string;
    
    const supabaseAction = await createSupabaseServerClient();
    await supabaseAction
      .from("integrations")
      .update({ bank_account_id: accountId, bank_account_name: accountName })
      .eq("user_id", user.id)
      .eq("provider", "xero");
      
    redirect("/settings/integrations");
  }

  return (
    <Container className="py-12 max-w-2xl mx-auto">
      <Card className="bg-white/[0.025] border-white/10">
        <CardHeader>
          <CardTitle className="text-xl">Select Xero Bank Account</CardTitle>
          <CardDescription>
            Choose the bank account where Duely should record payments sent to Xero.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <div className="text-sm text-zinc-400 py-4">
              No active bank accounts found in your Xero organization. Please add one in Xero first.
              <div className="mt-4">
                <Link href="/settings/integrations">
                  <Button variant="outline">Return to Integrations</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <form action={selectAccount} key={account.accountID}>
                  <input type="hidden" name="account_id" value={account.accountID} />
                  <input type="hidden" name="account_name" value={account.name} />
                  <Button 
                    variant="outline" 
                    className="w-full justify-between py-6 h-auto"
                    type="submit"
                  >
                    <span className="text-base">{account.name}</span>
                    <span className="text-xs text-zinc-500">{account.currencyCode}</span>
                  </Button>
                </form>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
