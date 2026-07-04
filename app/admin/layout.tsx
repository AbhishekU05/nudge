import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nudgeConfig } from "@/nudge.config";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import Link from "next/link";
import { Home, Users, Activity, Settings, ArrowLeft } from "lucide-react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  if (!nudgeConfig.adminEmails.includes(user.email)) {
    redirect("/"); // Not an admin
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 shrink-0">
          <Link href="/admin" className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-black text-white px-2 py-1 rounded">Admin</span>
            {nudgeConfig.appName}
          </Link>
        </div>
        
        <nav className="p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
            <Home size={18} /> Dashboard
          </Link>
          <Link href="/admin/organizations" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
            <Users size={18} /> Organizations
          </Link>
          <Link href="/admin/webhooks" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
            <Activity size={18} /> Webhooks
          </Link>
          <Link href="/admin/config" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
            <Settings size={18} /> Config
          </Link>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-200 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} /> Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-gray-800">Super Admin Console</h1>
          <div className="text-sm text-gray-500">Logged in as {user.email}</div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
