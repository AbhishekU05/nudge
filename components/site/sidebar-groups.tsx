"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, UserRound, X, Loader2, FileText, ArrowRight, XCircle } from "lucide-react";
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
  groups: GroupRecord[];
  isExpanded: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<GroupRecord | null>(null);

  return (
    <>
      <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
          title={!isExpanded ? "New Group" : undefined}
        >
          <Plus className="h-5 w-5 shrink-0" />
          {isExpanded && <span className="truncate whitespace-nowrap text-sm font-medium">New Group</span>}
        </button>

        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setActiveGroup(group)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
              activeGroup?.id === group.id
                ? "bg-white/[0.08] text-zinc-100"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
            )}
            title={!isExpanded ? group.name : undefined}
          >
            <UserRound className="h-5 w-5 shrink-0" style={{ color: group.color || "#3b82f6" }} />
            {isExpanded && <span className="truncate whitespace-nowrap text-sm">{group.name}</span>}
          </button>
        ))}
      </div>

      {isModalOpen && <CreateGroupModal onClose={() => setIsModalOpen(false)} />}
      
      <GroupSlideOutPanel 
        group={activeGroup} 
        onClose={() => setActiveGroup(null)} 
      />
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

function GroupSlideOutPanel({ group, onClose }: { group: GroupRecord | null; onClose: () => void }) {
  const [customers, setCustomers] = useState<(ClientRecord & { totalOwed: number; currency: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!group) return;

    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      const supabase = createSupabaseBrowserClient();

      // Get customer_groups
      const { data: cgData } = await supabase
        .from("customer_groups")
        .select("customer_id")
        .eq("group_id", group!.id);

      if (!cgData || cgData.length === 0) {
        if (isMounted) {
          setCustomers([]);
          setIsLoading(false);
        }
        return;
      }

      const customerIds = cgData.map((cg) => cg.customer_id);

      // Fetch the customers
      const { data: clientsData } = await supabase
        .from("clients")
        .select("*")
        .in("id", customerIds);

      if (!clientsData) {
        if (isMounted) {
          setCustomers([]);
          setIsLoading(false);
        }
        return;
      }

      // Fetch invoices to calculate aggregates
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("*")
        .in("customer_id", customerIds);

      const invoicesList = invoicesData || [];

      const clientsWithData = clientsData.map((client) => {
        const clientInvoices = invoicesList.filter((i) => i.customer_id === client.id);
        const totalOwed = clientInvoices.reduce((sum, inv) => {
          if (inv.workflow_status === "paid" || inv.workflow_status === "written_off") return sum;
          return sum + getRemainingBalance(inv as any);
        }, 0);
        const currency = clientInvoices[0]?.currency || "USD";

        return {
          ...(client as ClientRecord),
          totalOwed,
          currency,
        };
      });

      if (isMounted) {
        setCustomers(clientsWithData.sort((a, b) => b.totalOwed - a.totalOwed));
        setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [group]);

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity duration-300",
          group ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Slide-out panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-[100] shadow-2xl transition-transform duration-300 flex flex-col",
          group ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: group?.color || "#3b82f6" }} />
            <h2 className="text-lg font-semibold text-zinc-100">{group?.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-100 transition-colors">
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {group?.description && (
            <p className="text-sm text-zinc-400 mb-6">{group.description}</p>
          )}

          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <UserRound className="h-4 w-4" /> Customers in this group
          </h3>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
              <p className="text-sm text-zinc-500">No customers found in this group.</p>
              <Link href="/customers" onClick={onClose} className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block">
                Assign from Customers Page
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map((c) => {
                const formattedTotal = new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: c.currency
                }).format(c.totalOwed);

                return (
                  <Link
                    href={`/customers/${c.id}`}
                    key={c.id}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors group/item"
                  >
                    <div>
                      <div className="font-medium text-zinc-200 text-sm mb-0.5">{c.name}</div>
                      <div className="text-xs text-zinc-500">{c.email || "No email"}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-zinc-300 text-sm mb-0.5">{formattedTotal}</div>
                      <div className="text-xs text-zinc-500 group-hover/item:text-blue-400 transition-colors flex items-center justify-end gap-1">
                        View <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
