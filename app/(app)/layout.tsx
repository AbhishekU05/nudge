import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/site/app-sidebar";
import { getDisplayName, getInitials } from "@/lib/utils";
import type { GroupRecord } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  
  let subscriptionStatus = "none";


  let groups: (GroupRecord & { customerCount: number })[] = [];
  let totalCustomers = 0;

  try {
    const orgRes = await supabase
      .from("organization_members")
      .select("organization_id, organizations(dodo_subscription_status)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (orgRes.data?.organization_id) {
      const [groupsRes, customersRes] = await Promise.all([
        supabase
          .from("groups")
          .select("*, customer_groups(count)")
          .order("name", { ascending: true }),
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
      ]);
      
      subscriptionStatus = (orgRes.data.organizations as { dodo_subscription_status?: string })?.dodo_subscription_status || "incomplete";


      
      if (groupsRes.data) {
        groups = groupsRes.data.map((g: { id: string; name: string; color?: string; customer_groups?: { count?: number }[] }) => ({
          ...g,
          customerCount: g.customer_groups?.[0]?.count ?? 0
        })) as (GroupRecord & { customerCount: number })[];
      }
      
      totalCustomers = customersRes.count ?? 0;
    }
  } catch {
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
        groups={groups}
        totalCustomers={totalCustomers}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
