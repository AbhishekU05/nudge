"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  Zap, 
  Activity, 
  KanbanSquare, 
  BarChart3, 
  Settings, 
  Search,
  Mail,
  CreditCard,
  Plus,
  Users,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalyticsClient } from "@/app/(app)/analytics/analytics-client";
import { PipelineClient } from "@/app/(app)/pipeline/pipeline-client";
import { ActivityFeed } from "@/app/(app)/activity/activity-feed";
import { DraftList } from "@/components/site/draft-list";
import { ActionsUI } from "@/app/(app)/actions/actions-ui";
import { DashboardUI } from "@/app/(app)/dashboard/dashboard-ui";
import { mockCustomers, mockEvents, mockClients, mockInvoices } from "@/lib/mock-data";
import { generateActionPlan } from "@/lib/action-engine";

export function InteractiveAppDemo() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "action-center" | "activity" | "pipeline" | "analytics" | "automate">("dashboard");
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { id: "dashboard", name: "Overview", icon: LayoutDashboard, color: "text-indigo-400", hoverColor: "hover:text-indigo-400", activeBg: "bg-indigo-500/10" },
    { id: "action-center", name: "Action Center", icon: Zap, color: "text-amber-400", hoverColor: "hover:text-amber-400", activeBg: "bg-amber-500/10" },
    { id: "activity", name: "Activity", icon: Activity, color: "text-emerald-400", hoverColor: "hover:text-emerald-400", activeBg: "bg-emerald-500/10" },
    { id: "pipeline", name: "Pipeline", icon: KanbanSquare, color: "text-amber-400", hoverColor: "hover:text-amber-400", activeBg: "bg-amber-500/10" },
    { id: "analytics", name: "Analytics", icon: BarChart3, color: "text-blue-400", hoverColor: "hover:text-blue-400", activeBg: "bg-blue-500/10" },
    { id: "automate", name: "Automate", icon: Mail, color: "text-amber-400", hoverColor: "hover:text-amber-400", activeBg: "bg-amber-500/10" },
  ] as const;

  // Prepare mock data
  const customers = mockCustomers;
  const events = mockEvents;
  const uniqueCurrencies = ["USD"];
  const selectedCurrency = "USD";
  const recentEvents = [...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  const recentInvoices = [...customers].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  const pendingDrafts: any[] = [];
  const activeAutomations: any[] = [];

  // Generate real tasks for Action Center
  // Deep copy to prevent mutating the mock data multiple times
  const clonedInvoices = JSON.parse(JSON.stringify(mockInvoices));
  const clonedEvents = JSON.parse(JSON.stringify(mockEvents));
  for (const inv of clonedInvoices) {
    if (!inv.followup_history) {
      inv.followup_history = [];
    }
    const invEvents = clonedEvents.filter((e: any) => e.invoice_id === inv.id);
    for (const e of invEvents) {
      inv.followup_history.push({
        ...e,
        followup_date: e.event_date || e.created_at
      });
    }
  }
  const tasks = generateActionPlan(mockClients, clonedInvoices);

  return (
    <div className="flex h-[700px] w-full bg-black rounded-xl overflow-hidden font-sans border border-white/10 shadow-2xl shadow-black/50">
      {/* Mock Sidebar */}
      <div 
        className={cn(
          "flex flex-col border-r border-white/10 bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 z-20 h-full",
          isExpanded ? "w-56" : "w-16"
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden px-2 w-full justify-center cursor-pointer">
            <div className="h-8 w-8 shrink-0 rounded-md bg-white flex items-center justify-center text-black font-bold">
              D
            </div>
            {isExpanded && (
              <span className="text-xl font-semibold tracking-tight text-zinc-50 truncate transition-opacity duration-300">
                Duely
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-2 overflow-y-auto custom-scrollbar mt-4">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors cursor-pointer text-left",
                  isActive
                    ? `${item.activeBg} ${item.color} font-medium`
                    : `text-zinc-400 hover:bg-white/[0.04] ${item.hoverColor}`
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {isExpanded && (
                  <span className="truncate whitespace-nowrap text-sm">
                    {item.name}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        
        {/* Mock Groups */}
        <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
          <button
            className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 cursor-not-allowed"
            title={!isExpanded ? "New Group" : undefined}
          >
            <div className="flex flex-col items-center justify-center w-5 h-full">
              <Plus className="h-5 w-5 shrink-0" />
            </div>
            {isExpanded && <span className="truncate whitespace-nowrap text-sm font-medium">New Group</span>}
          </button>

          {/* Static Global Group */}
          <div className="flex flex-col">
            <button
              className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 cursor-not-allowed"
              title={!isExpanded ? "All" : undefined}
            >
              <div className="flex flex-col items-center justify-center w-5">
                <Users className="h-5 w-5 shrink-0 text-indigo-400" />
                <span className="text-[10px] mt-1 font-mono leading-none text-zinc-500">{customers.length}</span>
              </div>
              {isExpanded && <span className="truncate whitespace-nowrap text-sm">All</span>}
            </button>
          </div>
        </div>
        
        {/* Mock Bottom Nav */}
        <div className="border-t border-white/10 p-2 space-y-1 mb-2">
          <div className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-zinc-500 cursor-not-allowed">
            <CreditCard className="h-5 w-5 shrink-0" />
            {isExpanded && <span className="truncate whitespace-nowrap text-sm">Billing & Plan</span>}
          </div>
          <div className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-zinc-500 cursor-not-allowed">
            <Settings className="h-5 w-5 shrink-0" />
            {isExpanded && <span className="truncate whitespace-nowrap text-sm">Settings</span>}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0A] relative">
        {/* Top Header Mock */}
        <div className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between px-6 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-sm z-10">
          <div className="flex items-center text-sm text-zinc-500">
            <span className="capitalize">{activeTab.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-full px-3 py-1.5">
              <Search className="w-4 h-4 text-zinc-500" />
              <span className="text-xs text-zinc-500">Search clients...</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-sm font-semibold border border-indigo-500/30">
              U
            </div>
          </div>
        </div>

        {/* Content Views */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activeTab === "dashboard" && (
            <DashboardUI
              customers={customers}
              events={events}
              recentEvents={recentEvents}
              recentInvoices={recentInvoices}
              activeAutomations={activeAutomations}
              pendingDrafts={pendingDrafts}
              uniqueCurrencies={uniqueCurrencies}
              selectedCurrency={selectedCurrency}
            />
          )}

          {activeTab === "action-center" && (
            <div className="max-w-5xl mx-auto">
              <ActionsUI tasks={tasks} isAllUnder3Days={false} />
            </div>
          )}

          {activeTab === "pipeline" && (
            <PipelineClient initialCustomers={customers} currency={selectedCurrency} />
          )}

          {activeTab === "analytics" && (
            <div className="pb-20">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-zinc-100">Analytics & Reports</h2>
                <p className="text-zinc-400 mt-1">Deep dive into your collection metrics and cash flow performance.</p>
              </div>
              <AnalyticsClient customers={customers} events={events} />
            </div>
          )}
          {activeTab === "activity" && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Activity</h1>
                <p className="mt-2 text-zinc-400">A timeline of events across your collections workflow.</p>
              </div>
              <ActivityFeed events={events} />
            </div>
          )}

          {activeTab === "automate" && (
            <div className="max-w-5xl mx-auto">
              <div className="mb-12">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Queue</h1>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/5 text-zinc-400">0 waiting</span>
                </div>
                <p className="mt-2 text-zinc-400 max-w-xl mb-6">
                  Review and approve automated emails before they are sent. 
                </p>
                <DraftList initialDrafts={[]} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
