import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LateFeeManager } from "./late-fee-manager";
import { LateFeePolicy, GroupRecord } from "@/lib/types";

export default async function LateFeesSettingsPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [policiesResponse, groupsResponse] = await Promise.all([
    supabase
      .from("late_fee_policies")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("groups")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true })
  ]);

  const policies = (policiesResponse.data || []) as LateFeePolicy[];
  const groups = (groupsResponse.data || []) as GroupRecord[];

  const { isAutomationAndIntegrationAllowed } = await import("@/lib/payments");
  let isAllowed = true;
  const { data: member } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).single();
  if (member) {
    const { data: org } = await supabase.from("organizations").select("dodo_subscription_status, created_at").eq("id", member.organization_id).single();
    if (org) {
      isAllowed = isAutomationAndIntegrationAllowed(org.dodo_subscription_status, org.created_at);
    }
  }

  if (!isAllowed) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-50">Late Fee Policies</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Automatically apply fees to overdue invoices based on your custom rules.
          </p>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
          <h3 className="text-lg font-medium text-rose-400 mb-2">Feature Locked</h3>
          <p className="text-sm text-zinc-300 mb-4">
            Upgrade to a paid subscription to automate late fees and ensure you get paid what you're owed.
          </p>
          <a 
            href="/settings/billing" 
            className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
          >
            Upgrade Plan
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-50">Late Fee Policies</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Automatically apply fees to overdue invoices based on your custom rules.
        </p>
      </div>
      
      <LateFeeManager initialPolicies={policies} groups={groups} />
    </div>
  );
}
