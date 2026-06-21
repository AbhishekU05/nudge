import { requireUser } from "@/lib/auth";
import { updateProfileName, logout } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserRound, LogOut } from "lucide-react";
import { getDisplayName } from "@/lib/utils";

export default async function GeneralSettingsPage() {
  const user = await requireUser();
  const displayName = getDisplayName(
    user.user_metadata?.full_name,
    user.email?.split("@")[0] ?? "Profile",
  );

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

      <Card className="border-red-500/10 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-xl text-red-400">Danger Zone</CardTitle>
          <CardDescription className="text-red-400/70">
            Sign out of your account or permanently delete your data.
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
