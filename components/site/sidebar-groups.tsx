"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, UserRound, X, Loader2, FileText, ArrowRight, XCircle, Globe, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { createGroup } from "@/app/(app)/customers/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { GroupRecord, ClientRecord, InvoiceRecord, getRemainingBalance } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SidebarGroups({
  groups,
  isExpanded,
}: {
  groups: (GroupRecord & { customerCount?: number })[];
  isExpanded: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  return (
    <>
      <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
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
            onClick={() => setActiveGroup(activeGroup === "global" ? null : "global")}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
              activeGroup === "global"
                ? "bg-white/[0.08] text-zinc-100"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
            )}
            title={!isExpanded ? "All" : undefined}
          >
            <div className="flex flex-col items-center justify-center w-5">
              <Users className="h-5 w-5 shrink-0 text-indigo-400" />
            </div>
            {isExpanded && <span className="truncate whitespace-nowrap text-sm">All</span>}
          </button>

          {activeGroup === "global" && (
            <div className="flex flex-col mt-1 ml-3 pl-3 border-l border-white/10 space-y-1">
              <Link
                href="/customers"
                className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                title={!isExpanded ? "All Customers" : undefined}
              >
                <div className="flex flex-col items-center justify-center w-5">
                  <Users className="h-4 w-4 shrink-0" />
                </div>
                {isExpanded && <span className="truncate whitespace-nowrap text-sm">Customers</span>}
              </Link>
              <Link
                href="/invoices"
                className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                title={!isExpanded ? "All Invoices" : undefined}
              >
                <div className="flex flex-col items-center justify-center w-5">
                  <FileText className="h-4 w-4 shrink-0" />
                </div>
                {isExpanded && <span className="truncate whitespace-nowrap text-sm">Invoices</span>}
              </Link>
            </div>
          )}
        </div>

        {groups.map((group) => {
          const isActive = activeGroup === group.id;
          return (
            <div key={group.id} className="flex flex-col">
              <button
                onClick={() => setActiveGroup(isActive ? null : group.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
                  isActive
                    ? "bg-white/[0.08] text-zinc-100"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                )}
                title={!isExpanded ? group.name : undefined}
              >
                <div className="flex flex-col items-center justify-center w-5">
                  <UserRound className="h-5 w-5 shrink-0" style={{ color: group.color || "#3b82f6" }} />
                  <span className="text-[10px] mt-1 font-mono leading-none text-zinc-500">{group.customerCount || 0}</span>
                </div>
                {isExpanded && <span className="truncate whitespace-nowrap text-sm">{group.name}</span>}
              </button>

              {isActive && (
                <div className="flex flex-col mt-1 ml-3 pl-3 border-l border-white/10 space-y-1">
                  <Link
                    href={`/customers?groupId=${group.id}`}
                    className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                    title={!isExpanded ? "Customers" : undefined}
                  >
                    <div className="flex flex-col items-center justify-center w-5">
                      <UserRound className="h-4 w-4 shrink-0" />
                    </div>
                    {isExpanded && <span className="truncate whitespace-nowrap text-sm">Customers</span>}
                  </Link>
                  <Link
                    href={`/invoices?groupId=${group.id}`}
                    className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                    title={!isExpanded ? "Invoices" : undefined}
                  >
                    <div className="flex flex-col items-center justify-center w-5">
                      <FileText className="h-4 w-4 shrink-0" />
                    </div>
                    {isExpanded && <span className="truncate whitespace-nowrap text-sm">Invoices</span>}
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && <CreateGroupModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isPending, startTransition] = useTransition();

  const handleSave = async () => {
    if (!name.trim()) return;

    startTransition(async () => {
      try {
        await createGroup({ name, description, color });
        onClose();
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-100">Create New Group</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. VIP Clients"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. High priority customers"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
              />
              <span className="text-sm text-zinc-400">{color}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
            <Button variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Group
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


