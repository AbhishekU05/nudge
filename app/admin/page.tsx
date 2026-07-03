import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Users, CreditCard, Activity, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
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
    </div>
  );
}
