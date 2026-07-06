import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAvailableXeroTenants } from "@/lib/xero";
import { selectXeroTenant } from "@/app/actions/integrations";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default async function XeroTenantSelectionPage() {
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
    .maybeSingle();

  if (error || !integration || integration.tenant_id !== "PENDING_SELECTION") {
    redirect("/settings/integrations");
  }

  let tenants: { tenantId: string; tenantName: string; [key: string]: unknown }[] = [];
  try {
    tenants = (await getAvailableXeroTenants(member.organization_id)) as { tenantId: string; tenantName: string; [key: string]: unknown }[];
  } catch (e) {
    logger.error({ 
      message: "Failed to fetch Xero tenants", 
      context: "xero:tenants", 
      organization_id: member.organization_id,
      error: e 
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-12">
      <Card className="bg-white/[0.025] border-white/10">
        <CardHeader>
          <CardTitle className="text-xl">Select Xero Organization</CardTitle>
          <CardDescription>
            You have granted access to multiple Xero organizations. Choose which one to connect to Duely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-sm text-zinc-400 py-4">
              No Xero organizations found or token expired. Please try connecting again.
            </div>
          ) : (
            <div className="space-y-3">
              {tenants.map((tenant) => (
                <form action={selectXeroTenant} key={tenant.tenantId}>
                  <input type="hidden" name="tenantId" value={tenant.tenantId} />
                  <Button 
                    variant="secondary" 
                    className="w-full justify-between py-6 h-auto"
                    type="submit"
                  >
                    <span className="text-base">{tenant.tenantName}</span>
                    <span className="text-xs text-zinc-500">Connect</span>
                  </Button>
                </form>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
