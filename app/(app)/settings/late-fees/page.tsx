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
