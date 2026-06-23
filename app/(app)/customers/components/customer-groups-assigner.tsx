"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { GroupRecord } from "@/lib/types";
import { toggleCustomerGroup } from "../actions";
import { cn } from "@/lib/utils";

export function CustomerGroupsAssigner({
  customerId,
  allGroups,
  assignedGroupIds,
}: {
  customerId: string;
  allGroups: GroupRecord[];
  assignedGroupIds: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleGroup = (groupId: string, currentlyAssigned: boolean) => {
    startTransition(async () => {
      try {
        await toggleCustomerGroup(customerId, groupId, !currentlyAssigned);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const assignedGroups = allGroups.filter((g) => assignedGroupIds.includes(g.id));

  return (
    <div className="relative flex items-center gap-1.5 flex-wrap" ref={popoverRef}>
      {assignedGroups.map((g) => (
        <span
          key={g.id}
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
          style={{
            backgroundColor: `${g.color || "#3b82f6"}20`, // 20% opacity
            color: g.color || "#3b82f6",
            borderColor: `${g.color || "#3b82f6"}40`,
          }}
          title={g.name}
        >
          {g.name}
        </span>
      ))}

      <button
        onClick={(e) => {
          e.preventDefault(); // Prevent navigating to client page if inside a row click
          setIsOpen(!isOpen);
        }}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-zinc-600 text-zinc-400 hover:text-zinc-200 hover:border-zinc-400 transition-colors bg-transparent"
        title="Manage assigned groups"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-56 rounded-lg border border-zinc-800 bg-zinc-900 p-2 shadow-xl z-10">
          <p className="text-xs font-medium text-zinc-500 mb-2 px-2">Assign Groups</p>
          {allGroups.length === 0 ? (
            <p className="text-xs text-zinc-500 px-2 py-1">No groups available.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {allGroups.map((g) => {
                const isAssigned = assignedGroupIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleGroup(g.id, isAssigned);
                    }}
                    className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color || "#3b82f6" }} />
                      <span className="text-zinc-200 truncate max-w-[120px] text-left">{g.name}</span>
                    </div>
                    {isAssigned && <Check className="h-4 w-4 text-zinc-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
