import { Users, CreditCard, Activity, AlertCircle, Trash2, Crown } from "lucide-react";
import Link from "next/link";
import { wipeMyTestData, grantAdminLifetimeAccess } from "@/app/actions/admin";

export default async function AdminDashboard(props: { searchParams?: Promise<{ success?: string }> }) {
  const searchParams = await props.searchParams;
  // Use admin client to bypass RLS in the admin dashboard
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createSupabaseAdminClient();

  const [{ count: orgCount }, { count: webhooksCount }, { data: { users } }] = await Promise.all([
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase.from("webhook_events").select("*", { count: "exact", head: true }),
    supabase.auth.admin.listUsers()
  ]);
  const usersCount = users?.length || 0;

  const stats = [
    { name: "Total Organizations", value: orgCount || 0, icon: Users, href: "/admin/organizations" },
    { name: "Total Users", value: usersCount || 0, icon: Users, href: "#" },
    { name: "Active Subscriptions", value: "N/A", icon: CreditCard, href: "/admin/organizations" },
    { name: "Webhook Events", value: webhooksCount || 0, icon: Activity, href: "/admin/webhooks" },
  ];

  return (
    <div className="space-y-6">
      {searchParams?.success && (
        <div className="p-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm">
          {searchParams.success}
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href} className="block group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-600 group-hover:bg-black group-hover:text-white transition-colors">
                  <stat.icon size={24} />
                </div>
              </div>
              <h3 className="text-gray-500 text-sm font-medium">{stat.name}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="text-amber-500" size={20} />
          System Health
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          All core systems are operational. Monitor incoming webhook events to detect any ingestion failures from Dodo Payments.
        </p>
        <div className="flex gap-4">
          <Link href="/admin/webhooks" className="text-sm bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors">
            View Webhook Logs
          </Link>
        </div>
      </div>

      <div className="mt-8 border border-red-200 bg-red-50/30 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-700">
          <Trash2 size={20} />
          Danger Zone
        </h3>
        <p className="text-red-600/80 text-sm mb-4">
          Need to reset your workspace? This will instantly and permanently wipe all customers, invoices, payments, and events belonging to <strong>your organization only</strong>. It will not affect other users.
        </p>
        <form action={wipeMyTestData}>
          <button type="submit" className="text-sm bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 transition-colors">
            Wipe My Test Data
          </button>
        </form>
      </div>

      <div className="mt-8 border border-indigo-200 bg-indigo-50/30 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-indigo-700">
          <Crown size={20} />
          Admin Perks
        </h3>
        <p className="text-indigo-600/80 text-sm mb-4">
          Instantly upgrade the admin organization to an active Annual Plan. This bypasses Dodo Payments entirely and unlocks all automated reminders, Xero/Quickbooks syncing, and premium features forever.
        </p>
        <form action={grantAdminLifetimeAccess}>
          <button type="submit" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 transition-colors">
            Grant Lifetime Access
          </button>
        </form>
      </div>
    </div>
  );
}
