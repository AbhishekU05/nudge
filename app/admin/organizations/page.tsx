import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { revalidatePath } from "next/cache";
import { inngest } from "@/lib/inngest/client";

export default async function AdminOrganizations() {
  const supabase = createSupabaseAdminClient();

  const [orgsRes, usersRes] = await Promise.all([
    supabase
      .from("organizations")
      .select(`
        *,
        integrations(provider, is_active, last_synced_at),
        organization_members(user_id, role)
      `)
      .order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers()
  ]);

  const { data: orgs, error } = orgsRes;
  const users = usersRes.data?.users || [];

  if (error) {
    return <div className="text-red-500">Error loading organizations: {error.message}</div>;
  }

  async function forceSync(formData: FormData) {
    "use server";
    const orgId = formData.get("orgId") as string;
    const provider = formData.get("provider") as string;
    
    if (provider === "xero") {
      await inngest.send({
        name: "xero/integration.connected",
        data: { organization_id: orgId },
      });
    } else if (provider === "quickbooks") {
      await inngest.send({
        name: "quickbooks/integration.connected",
        data: { organization_id: orgId },
      });
    }
    
    revalidatePath("/admin/organizations");
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Organization & Domain</th>
                <th className="px-6 py-4">Members (Emails)</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4">Integrations</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orgs?.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{org.name}</div>
                    {org.domain ? (
                      <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs w-fit mt-2">{org.domain}</div>
                    ) : (
                      <div className="text-gray-400 italic text-xs mt-2">No domain setup</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {org.organization_members?.map((member: { user_id: string; role: string }) => {
                        const user = users.find(u => u.id === member.user_id);
                        return user?.email ? (
                          <span key={member.user_id} className="text-sm text-gray-700 flex items-center gap-2">
                            {user.email} 
                            <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-600 uppercase">{member.role}</span>
                          </span>
                        ) : null;
                      })}
                      {(!org.organization_members || org.organization_members.length === 0) && (
                        <span className="text-xs text-gray-400 italic">No members found</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit px-2 py-1 rounded text-xs font-medium ${
                        org.dodo_subscription_status === "active" ? "bg-green-100 text-green-700" :
                        org.dodo_subscription_status ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {org.dodo_subscription_status || "No Plan"}
                      </span>
                      {org.plan_type && <span className="text-xs text-gray-500 capitalize">{org.plan_type}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {org.integrations?.map((int: { provider: string; is_active: boolean; last_synced_at: string | null }) => (
                        <div key={int.provider} className="flex items-center gap-2 text-xs">
                          <span className={`w-2 h-2 rounded-full ${int.is_active ? "bg-green-500" : "bg-red-500"}`}></span>
                          <span className="capitalize font-medium">{int.provider}</span>
                          <span className="text-gray-400">
                            {int.last_synced_at ? format(new Date(int.last_synced_at), "MMM d, HH:mm") : "Never synced"}
                          </span>
                        </div>
                      ))}
                      {(!org.integrations || org.integrations.length === 0) && (
                        <span className="text-gray-400 italic text-xs">No integrations</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {org.integrations?.map((int: { provider: string; is_active: boolean }) => int.is_active && (
                      <form key={int.provider} action={forceSync} className="inline-block ml-2">
                        <input type="hidden" name="orgId" value={org.id} />
                        <input type="hidden" name="provider" value={int.provider} />
                        <button 
                          type="submit" 
                          title={`Force sync ${int.provider}`}
                          className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </form>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
