"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  Zap, 
  Activity, 
  KanbanSquare, 
  BarChart3, 
  Mail, 
  CreditCard, 
  Settings, 
  User, 
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { AnalyticsClient } from "@/app/(app)/analytics/analytics-client";
import { mockCustomers, mockEvents, mockUser } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

const MOCK_TASKS = [
  {
    id: "t1",
    client: "Acme Corp",
    type: "critical",
    headline: "Follow up on broken promise",
    amount: "$15,400.00",
    description: "Acme Corp promised to pay by Friday, but no payment was received. They are now 18 days late.",
    action: "Send Firm Follow-up",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20"
  },
  {
    id: "t2",
    client: "Initech LLC",
    type: "moderate",
    headline: "Send a friendly check-in",
    amount: "$2,150.00",
    description: "Initech LLC is 14 days overdue. There are no broken promises, but the invoice is getting stale.",
    action: "Friendly Check-in",
    icon: Clock,
    iconColor: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20"
  },
  {
    id: "t3",
    client: "Globex Inc",
    type: "system",
    headline: "Escalate to Final Warning",
    amount: "$8,200.00",
    description: "The 3-email sequence finished yesterday with no response. They are now 32 days overdue.",
    action: "Pause Services Warning",
    icon: Zap,
    iconColor: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20"
  }
];

function MockActionCenter() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Action Center</h2>
          <p className="text-zinc-400 mt-1">Smart recommendations based on invoice history and behavioral patterns.</p>
        </div>
        <Button variant="secondary" className="hidden sm:flex">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Mark all as done
        </Button>
      </div>

      <div className="space-y-4 mt-6">
        {MOCK_TASKS.map(task => (
          <div key={task.id} className={cn("rounded-xl border p-5 flex flex-col md:flex-row md:items-center gap-5 transition-colors", task.border, "bg-white/[0.02] hover:bg-white/[0.04]")}>
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", task.bg)}>
              <task.icon className={cn("w-6 h-6", task.iconColor)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-zinc-200">{task.headline}</h3>
                <span className="font-medium text-zinc-300">{task.amount}</span>
              </div>
              <div className="text-sm font-medium text-zinc-400 mb-2">
                Client: <span className="text-zinc-300">{task.client}</span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {task.description}
              </p>
            </div>
            <div className="shrink-0 mt-4 md:mt-0">
              <Button className="w-full md:w-auto">
                {task.action}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockPipeline() {
  const columns = [
    { name: "Current", count: 12, amount: "$45,000" },
    { name: "1-14 Days Late", count: 4, amount: "$12,400" },
    { name: "15-30 Days Late", count: 2, amount: "$8,500" },
    { name: "31+ Days Late", count: 1, amount: "$4,200" }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-100">Pipeline</h2>
        <p className="text-zinc-400 mt-1">Track customer payment statuses across aging buckets.</p>
      </div>
      
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <div className="flex gap-4 h-full min-w-max pb-4">
          {columns.map(col => (
            <div key={col.name} className="w-80 flex flex-col bg-white/[0.02] border border-white/5 rounded-xl flex-shrink-0">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-medium text-zinc-300">{col.name}</h3>
                <div className="bg-white/10 text-zinc-400 text-xs px-2 py-0.5 rounded-full">{col.count}</div>
              </div>
              <div className="p-4 bg-white/[0.01]">
                <div className="text-lg font-semibold text-zinc-200">{col.amount}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Total Value</div>
              </div>
              <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                {Array.from({ length: Math.min(3, col.count) }).map((_, i) => (
                  <div key={i} className="bg-zinc-900/50 border border-white/10 p-3 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm text-zinc-200">Customer {i+1}</div>
                      <div className="text-xs text-zinc-400">INV-00{i+1}</div>
                    </div>
                    <div className="text-lg font-semibold text-zinc-300 mb-3">${(Math.random() * 5000 + 500).toFixed(2)}</div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-zinc-500">Updated 2d ago</div>
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-medium">
                        {(["A", "B", "C", "D"])[i]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InteractiveAppDemo() {
  const [activeTab, setActiveTab] = useState<"action-center" | "analytics" | "pipeline">("action-center");
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { id: "action-center", name: "Action Center", icon: Zap, color: "text-amber-400", hoverColor: "hover:text-amber-400", activeBg: "bg-amber-500/10" },
    { id: "pipeline", name: "Pipeline", icon: KanbanSquare, color: "text-amber-400", hoverColor: "hover:text-amber-400", activeBg: "bg-amber-500/10" },
    { id: "analytics", name: "Analytics", icon: BarChart3, color: "text-blue-400", hoverColor: "hover:text-blue-400", activeBg: "bg-blue-500/10" },
  ] as const;

  return (
    <div className="flex h-[600px] w-full bg-black rounded-xl overflow-hidden font-sans border border-white/10 shadow-2xl shadow-black/50">
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
        
        {/* Mock Bottom Nav */}
        <div className="border-t border-white/10 p-2 space-y-1 mb-2">
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          {activeTab === "action-center" && <MockActionCenter />}
          {activeTab === "pipeline" && <MockPipeline />}
          {activeTab === "analytics" && (
            <div className="h-full">
               <AnalyticsClient customers={mockCustomers} events={mockEvents} currency="USD" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
