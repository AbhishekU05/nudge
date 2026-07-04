"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { logout } from "@/app/actions/auth";
import {
  LayoutDashboard,
  Users,
  Activity,
  BarChart3,
  Settings,
  CreditCard,
  ChevronRight,
  LogOut,
  UserRound,
  KanbanSquare,
  FileText,
  Mail,
  Zap,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GroupRecord } from "@/lib/types";

type AppSidebarProps = {
  user: {
    email: string;
    displayName: string;
    initials: string;
  };
  subscriptionStatus: string;
  hasXero?: boolean;
  hasQuickBooks?: boolean;
  groups?: (GroupRecord & { customerCount: number })[];
  totalCustomers?: number;
};

import { GlobalSyncButton } from "./global-sync-button";
import { SidebarGroups } from "./sidebar-groups";

export function AppSidebar({ user, subscriptionStatus, hasXero, hasQuickBooks, groups = [], totalCustomers = 0 }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, color: "text-indigo-400", hoverColor: "hover:text-indigo-400", activeBg: "bg-indigo-500/10" },
    { name: "Action Center", href: "/actions", icon: Zap, color: "text-amber-400", hoverColor: "hover:text-amber-400", activeBg: "bg-amber-500/10" },
    { name: "Activity", href: "/activity", icon: Activity, color: "text-emerald-400", hoverColor: "hover:text-emerald-400", activeBg: "bg-emerald-500/10" },
    { name: "Pipeline", href: "/pipeline", icon: KanbanSquare, color: "text-amber-400", hoverColor: "hover:text-amber-400", activeBg: "bg-amber-500/10" },
    { name: "Analytics", href: "/analytics", icon: BarChart3, color: "text-blue-400", hoverColor: "hover:text-blue-400", activeBg: "bg-blue-500/10" },
    { name: "Automate", href: "/automate", icon: Mail, color: "text-amber-400", hoverColor: "hover:text-amber-400", activeBg: "bg-amber-500/10" },
  ];

  const bottomItems = [
    { 
      name: subscriptionStatus === "active" ? "Plan: Active" : "Billing & Plan", 
      href: "/settings/billing", 
      icon: CreditCard 
    },
    { name: "Settings", href: "/settings/general", icon: Settings },
  ];

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      className={cn(
        "flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-300 z-50 h-screen sticky top-0",
        isExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Header / Logo */}
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden px-2 w-full justify-center">
          <Image
            src="/logo.svg"
            width={32}
            height={32}
            alt="Duely Logo"
            className="h-8 w-8 shrink-0 rounded-md"
          />
          {isExpanded && (
            <span className="text-xl font-semibold tracking-tight text-zinc-50 truncate transition-opacity duration-300">
              Duely
            </span>
          )}
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">

        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
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
            </Link>
          );
        })}

        {groups && <SidebarGroups groups={groups} totalCustomers={totalCustomers} isExpanded={isExpanded} />}
      </nav>

      {/* Bottom Nav */}
      <div className="border-t border-white/10 p-2 space-y-1">
        {(hasXero || hasQuickBooks) && (
          <div className="mb-1">
            <GlobalSyncButton isExpanded={isExpanded} provider={hasXero ? 'xero' : 'quickbooks'} />
          </div>
        )}
        {bottomItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {isExpanded && (
                <span className="truncate whitespace-nowrap text-sm">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Profile Section */}
      <div className="p-2 border-t border-white/10 relative" ref={profileRef}>
        <div 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="group relative flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.04] cursor-pointer"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-xs font-semibold text-zinc-100">
            {user.initials}
          </div>
          {isExpanded && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-sm font-medium text-zinc-200">
                {user.displayName}
              </span>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        {isProfileOpen && (
          <div className={cn(
            "absolute bottom-full mb-2 bg-zinc-900 border border-white/10 shadow-xl rounded-lg py-1 flex flex-col z-50",
            isExpanded ? "left-2 right-2" : "left-2 w-48"
          )}>
            <div className="px-3 py-2 border-b border-white/10 mb-1">
              <p className="text-sm font-medium text-zinc-200 truncate">{user.displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            
            <Link 
              href="/settings/general" 
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.04] hover:text-zinc-100 transition-colors"
              onClick={() => setIsProfileOpen(false)}
            >
              <UserRound className="h-4 w-4" />
              Profile Settings
            </Link>
            
            <form action={logout}>
              <button 
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
