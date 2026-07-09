import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasActiveSubscription } from "@/lib/payments";
import { redirect } from "next/navigation";
import { Building2, Users, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrgMemberRole } from "@/lib/types";
import { LogoUploadForm } from "@/components/settings/logo-upload-form";

export default async function OrganizationSettingsPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Find org id and subscription status
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .single();
    
  if (!member) {
    redirect("/settings/general");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", member.organization_id)
    .single();

  if (!org) {
    redirect("/settings/general");
  }

  const hasSubscription = hasActiveSubscription(org.dodo_subscription_status, org.created_at);

  if (!hasSubscription) {
    redirect("/settings/general"); // Prevent access to unsubscribed users
  }

  // Fetch all members of the organization
  const { data: orgMembers } = await supabase
    .from("organization_members")
    .select("role, user_id, created_at, profiles(full_name, gmail_connected_email)")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: true });

  const getRoleBadge = (role: OrgMemberRole) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Owner</Badge>;
      case "admin":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Admin</Badge>;
      default:
        return <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20">Member</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-50">Organization Settings</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your organization details and team members.
        </p>
      </div>

      <Card className="bg-white/[0.035]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Workspace Information
          </CardTitle>
          <CardDescription>Basic information about your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-white/5 bg-black/20 p-4">
              <dt className="text-sm font-medium text-zinc-400">Organization Name</dt>
              <dd className="mt-1 text-lg font-semibold text-zinc-100">{org.name}</dd>
            </div>
            <div className="rounded-lg border border-white/5 bg-black/20 p-4">
              <dt className="text-sm font-medium text-zinc-400">Workspace Domain</dt>
              <dd className="mt-1 text-lg font-semibold text-zinc-100">
                {org.domain ? org.domain : <span className="text-zinc-600 italic">Not set</span>}
              </dd>
            </div>
            <div className="col-span-1 sm:col-span-2 rounded-lg border border-white/5 bg-black/20 p-4">
              <dt className="text-sm font-medium text-zinc-400 mb-2">Company Logo (Max 500KB)</dt>
              <dd className="mt-1">
                <LogoUploadForm currentLogo={org.logo_url} />
                {org.logo_url && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-center w-32 h-32">
                    <img src={org.logo_url} alt="Company Logo" className="max-h-full max-w-full object-contain drop-shadow-md" />
                  </div>
                )}
              </dd>
            </div>
            
            <div className="col-span-1 sm:col-span-2 rounded-lg border border-white/5 bg-black/20 p-4">
              <dt className="text-sm font-medium text-zinc-400 mb-2">Organization Timezone</dt>
              <dd className="mt-1">
                <form action={async (formData) => {
                  "use server";
                  const { updateOrganizationTimezone } = await import("@/app/actions/organization");
                  await updateOrganizationTimezone(formData);
                }} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <select 
                    id="timezone"
                    name="timezone"
                    defaultValue={org.timezone || "UTC"}
                    className="flex h-9 w-full sm:max-w-xs rounded-md border border-white/10 bg-black/40 px-3 py-1 text-sm shadow-sm transition-colors text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Central European Time (CET)</option>
                    <option value="Asia/Kolkata">India Standard Time (IST)</option>
                    <option value="Australia/Sydney">Australian Eastern Time (AET)</option>
                    <option value="UTC">UTC</option>
                  </select>
                  <button type="submit" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                    Save Timezone
                  </button>
                </form>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.035]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Members
            </div>
          </CardTitle>
          <CardDescription>The people who have access to this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-white/10 overflow-hidden bg-black/20">
            <div className="divide-y divide-white/5">
              {orgMembers?.map((mRaw) => {
                const m = mRaw as { user_id: string; role?: string; profiles?: { full_name?: string; gmail_connected_email?: string } | { full_name?: string; gmail_connected_email?: string }[]; [key: string]: unknown };
                const isCurrentUser = m.user_id === user.id;
                const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                const name = profile?.full_name || "Unknown User";
                const email = profile?.gmail_connected_email;

                return (
                  <div key={m.user_id} className="flex items-center justify-between p-4 transition-colors hover:bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-medium">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-100">
                            {name}
                          </p>
                          {isCurrentUser && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">You</span>
                          )}
                        </div>
                        {email && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                            <Mail className="h-3 w-3" />
                            {email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getRoleBadge(m.role as OrgMemberRole)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
