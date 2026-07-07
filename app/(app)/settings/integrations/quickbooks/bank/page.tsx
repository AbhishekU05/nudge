import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Container } from "@/components/site/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import Link from "next/link";
import { QuickBooksIntegrationRow, getApiBaseUrl, getValidQuickBooksTokens } from "@/lib/quickbooks";
import { saveQuickBooksDefaultBank } from "@/app/actions/integrations";

export default async function QuickBooksBankSelectionPage() {
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
    .eq("provider", "quickbooks")
    .maybeSingle<QuickBooksIntegrationRow>();

  if (error || !integration || !integration.realm_id) {
    redirect("/settings/integrations");
  }

  let bankAccounts: { Id: string; Name: string; AcctNum?: string; [key: string]: unknown }[] = [];
  try {
    const validIntegration = await getValidQuickBooksTokens(integration);
    const baseUrl = await getApiBaseUrl();
    const query = `select * from Account where AccountType = 'Bank'`;
    
    const url = new URL(`${baseUrl}/v3/company/${integration.realm_id}/query`);
    url.searchParams.set("query", query);
    url.searchParams.set("minorversion", "65");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${validIntegration.access_token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      bankAccounts = data.QueryResponse?.Account || [];
    } else {
      logger.error({ 
        message: "Failed to fetch QBO bank accounts", 
        context: "qbo:bank_accounts", 
        status: response.status,
        response: await response.text()
      });
    }
  } catch (e) {
    logger.error({ 
      message: "Failed to fetch QBO bank accounts", 
      context: "qbo:bank_accounts", 
      user_id: user.id,
      error: e 
    });
  }

  return (
    <Container className="py-12 max-w-2xl mx-auto">
      <Card className="bg-white/[0.025] border-white/10">
        <CardHeader>
          <CardTitle className="text-xl">Select Default QuickBooks Bank Account</CardTitle>
          <CardDescription>
            Choose the default bank account where Duely should record automated payments (like client portal payments) sent to QuickBooks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <div className="text-sm text-zinc-400 py-4">
              No active bank accounts found in your QuickBooks organization. Please add one in QuickBooks first.
              <div className="mt-4">
                <Link href="/settings/integrations">
                  <Button variant="secondary">Return to Integrations</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <form key={account.Id} action={saveQuickBooksDefaultBank}>
                  <input type="hidden" name="bankAccountId" value={account.Id} />
                  <input type="hidden" name="bankAccountName" value={account.Name} />
                  <button
                    type="submit"
                    className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-medium text-zinc-200">{account.Name}</p>
                      <p className="text-sm text-zinc-500 mt-1">
                        {account.AcctNum ? `Account: ****${account.AcctNum.slice(-4)}` : 'Bank Account'}
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
