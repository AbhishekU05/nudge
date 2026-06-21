"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Activity,
  BarChart3,
  Settings,
  CreditCard,
  ChevronRight,
  LogOut,
  UserRound
} from "lucide-react";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  user: {
    email: string;
    displayName: string;
    initials: string;
  };
  subscriptionStatus: string;
};

export function AppSidebar({ user, subscriptionStatus }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  ];

  const bottomItems = [
    { 
      name: subscriptionStatus === "active" ? "Plan: Active" : "Billing & Plan", 
      href: "/settings/billing", 
      icon: CreditCard 
    },
    { name: "Settings", href: "/settings/integrations", icon: Settings },
  ];

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
      </nav>

      {/* Bottom Nav */}
      <div className="border-t border-white/10 p-2 space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
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
      <div className="p-2 border-t border-white/10">
        <div className="group relative flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.04] cursor-pointer">
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
      </div>
    </div>
  );
}
