import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/site/app-sidebar";
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

  let groups: any[] = [];
  let totalCustomers = 0;

  try {
    const [orgRes, integrationsRes, groupsRes, customersRes] = await Promise.all([
      supabase
        .from("organization_members")
        .select("organizations(dodo_subscription_status)")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("integrations")
        .select("provider")
        .eq("user_id", user.id),
      supabase
        .from("groups")
        .select("*, customer_groups(count)")
        .order("name", { ascending: true }),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
    ]);
      
    const org = orgRes.data?.organizations as any;
    if (org?.dodo_subscription_status) {
      subscriptionStatus = org.dodo_subscription_status;
    }

    if (integrationsRes.data) {
      hasXero = integrationsRes.data.some(i => i.provider === "xero");
      hasQuickBooks = integrationsRes.data.some(i => i.provider === "quickbooks");
    }

    if (groupsRes.data) {
      groups = groupsRes.data.map(g => ({
        ...g,
        customerCount: g.customer_groups?.[0]?.count ?? 0
      }));
    }

    if (customersRes.count) {
      totalCustomers = customersRes.count;
    }
  } catch (e) {
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
