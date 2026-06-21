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
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("razorpay_subscription_status")
      .eq("user_id", user.id)
      .maybeSingle();
      
    if (profile?.razorpay_subscription_status) {
      subscriptionStatus = profile.razorpay_subscription_status;
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
      />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
