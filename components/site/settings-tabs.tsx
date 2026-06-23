"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SettingsTabs() {
  const pathname = usePathname();

  const tabs = [
    { name: "General", href: "/settings/general" },
    { name: "Late Fees", href: "/settings/late-fees" },
    { name: "Integrations", href: "/settings/integrations" },
    { name: "Billing", href: "/settings/billing" },
  ];

  return (
    <div className="flex gap-4 border-b border-white/10 mb-8 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname?.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "whitespace-nowrap px-1 pb-4 text-sm font-medium transition-colors border-b-2",
              isActive
                ? "border-primary text-zinc-50"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-white/20"
            )}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
