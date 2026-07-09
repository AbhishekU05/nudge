import { requireUser } from "@/lib/auth";
import { updateProfileName, logout, updateDigestSettings, updateProfileInfo } from "@/app/actions/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserRound, LogOut, Download, Mail, Building2 } from "lucide-react";
import { getDisplayName } from "@/lib/utils";

export default async function GeneralSettingsPage() {
  const user = await requireUser();
  const displayName = getDisplayName(
    user.user_metadata?.full_name,
    user.email?.split("@")[0] ?? "Profile",
  );

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("profiles").select("timezone, weekly_digest_enabled, full_name").eq("user_id", user.id).single();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="border-white/10 bg-white/[0.035]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <UserRound className="h-5 w-5 text-primary" />
            Profile Details
          </CardTitle>
          <CardDescription>
            Manage your personal profile information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfileName} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="profile_email" className="text-zinc-400">
                Email Address
              </Label>
              <Input
                id="profile_email"
                type="email"
                value={user.email || ""}
                disabled
                className="bg-black/20 text-zinc-500 border-white/5"
              />
              <p className="text-xs text-zinc-600">Your email is managed by your authentication provider.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profile_name" className="text-zinc-400">
                Display Name
              </Label>
              <Input
                id="profile_name"
                name="full_name"
                defaultValue={displayName}
                maxLength={100}
                required
                className="bg-transparent border-white/10 focus:border-primary/50"
              />
            </div>
            
            <Button type="submit">
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.035]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5 text-primary" />
            Company & Personal Info
          </CardTitle>
          <CardDescription>
            Additional information about you and your business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfileInfo} className="space-y-4 max-w-md">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="full_name" className="text-zinc-400">Full Name</Label>
                <Input 
                  id="full_name" 
                  name="full_name" 
                  defaultValue={profile?.full_name || ""} 
                  maxLength={100}
                  className="bg-transparent border-white/10 focus:border-primary/50" 
                />
              </div>
            </div>
            
            <Button type="submit">
              Save Info
            </Button>
          </form>
        </CardContent>
      </Card>


      <Card className="border-white/10 bg-white/[0.035]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Mail className="h-5 w-5 text-primary" />
            Weekly Digest
          </CardTitle>
          <CardDescription>
            Receive a weekly snapshot of your collections via email every Monday at 8 AM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateDigestSettings} className="space-y-4 max-w-md">
            <div className="flex items-center gap-2 mt-4">
              <input 
                type="checkbox" 
                id="weekly_digest_enabled" 
                name="weekly_digest_enabled" 
                value="true"
                defaultChecked={profile?.weekly_digest_enabled ?? true}
                className="h-4 w-4 bg-transparent border-white/10 rounded accent-primary"
              />
              <Label htmlFor="weekly_digest_enabled" className="text-zinc-300">
                Enable Weekly Digest
              </Label>
            </div>
            
            <Button type="submit" className="mt-4">
              Save Preferences
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.035]">
        <CardHeader className="border-b border-white/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Download className="h-5 w-5 text-primary" />
                Data Export
              </CardTitle>
              <CardDescription className="mt-2 max-w-xl">
                Download a full export of all your customers and their payment history in CSV format.
              </CardDescription>
            </div>
            <a href="/api/export-csv" download>
              <Button variant="secondary" size="sm">
                Export CSV
              </Button>
            </a>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-red-500/10 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-xl text-red-400">Account Session</CardTitle>
          <CardDescription className="text-red-400/70">
            Sign out of your account on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={logout}>
            <Button type="submit" variant="danger" className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
