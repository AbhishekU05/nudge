import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/site/app-sidebar";
import { isAutomationAndIntegrationAllowed } from "@/lib/payments";
import { getDisplayName, getInitials } from "@/lib/utils";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  
  let subscriptionStatus = "none";
  let hasXero = false;
  let hasQuickBooks = false;
  let isSubscribed = false;

  let groups: any[] = [];
  let totalCustomers = 0;

  try {
    const orgRes = await supabase
      .from("organization_members")
      .select("organization_id, organizations(dodo_subscription_status)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (orgRes.data?.organization_id) {
      const orgId = orgRes.data.organization_id;
      
      const [integrationsRes, groupsRes, customersRes] = await Promise.all([
        supabase
          .from("integrations")
          .select("provider")
          .eq("organization_id", orgId),
        supabase
          .from("groups")
          .select("*, customer_groups(count)")
          .order("name", { ascending: true }),
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
      ]);
      
      subscriptionStatus = (orgRes.data.organizations as any)?.dodo_subscription_status || "incomplete";
      const isAllowed = isAutomationAndIntegrationAllowed(
        subscriptionStatus,
        new Date().toISOString()
      );
      isSubscribed = isAllowed;

      if (integrationsRes.data) {
        hasXero = integrationsRes.data.some((i: any) => i.provider === "xero");
        hasQuickBooks = integrationsRes.data.some((i: any) => i.provider === "quickbooks");
      }
      
      if (groupsRes.data) {
        groups = groupsRes.data.map(g => ({
          ...g,
          customerCount: g.customer_groups?.[0]?.count ?? 0
        }));
      }
      
      totalCustomers = customersRes.count ?? 0;
    }
  } catch (error) {
    // Graceful fallback
  }

  const displayName = getDisplayName(
    user.user_metadata?.full_name,
    user.email?.split("@")[0] ?? "Profile",
  );
  
  const initials = getInitials(displayName);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar 
        user={{
          email: user.email || "",
          displayName,
          initials,
        }} 
        subscriptionStatus={subscriptionStatus} 
        hasXero={hasXero}
        hasQuickBooks={hasQuickBooks}
        groups={groups}
        totalCustomers={totalCustomers}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
