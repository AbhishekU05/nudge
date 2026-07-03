import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/payments";
import { Container } from "@/components/site/container";
import { SettingsTabs } from "@/components/site/settings-tabs";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  
  // Find org id and subscription status
  const { data: member } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).single();
  let hasSubscription = false;
  if (member) {
    const { data: org } = await supabase.from("organizations").select("dodo_subscription_status, created_at").eq("id", member.organization_id).single();
    if (org) {
      hasSubscription = hasActiveSubscription(org.dodo_subscription_status, org.created_at);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-6">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
              Settings
            </h1>
            <p className="mt-3 text-base leading-7 text-zinc-500">
              Manage your account, billing, and integrations.
            </p>
          </div>
          
          <SettingsTabs hasSubscription={hasSubscription} />
          
          {children}
        </Container>
      </main>
    </div>
  );
}
