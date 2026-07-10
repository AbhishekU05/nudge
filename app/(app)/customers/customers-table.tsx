"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerGroupsAssigner } from "./components/customer-groups-assigner";
import type { GroupRecord } from "@/lib/types";

type Client = {
  id: string;
  name: string;
  total_owed: number;
  total_paid: number;
  currency: string;
};

type SortColumn = "name" | "total_paid" | "total_owed";

function SortHeader({
  column,
  label,
  align,
  sortBy,
  sortDir,
  onSort,
}: {
  column: SortColumn;
  label: string;
  align?: "right";
  sortBy: SortColumn;
  sortDir: "asc" | "desc";
  onSort: (column: SortColumn) => void;
}) {
  const isActive = sortBy === column;
  return (
    <button
      onClick={() => onSort(column)}
      className={`inline-flex items-center gap-1 hover:text-zinc-100 transition-colors ${align === "right" ? "w-full justify-end" : ""}`}
    >
      {label}
      {isActive && (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
    </button>
  );
}

export function CustomersTable({
  clients,
  customerGroupsList,
  groupsList,
  sortBy,
  sortDir,
  sortHrefs,
}: {
  clients: Client[];
  customerGroupsList: { customer_id: string; group_id: string }[];
  groupsList: GroupRecord[];
  sortBy: SortColumn;
  sortDir: "asc" | "desc";
  sortHrefs: Record<SortColumn, string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSort(column: SortColumn) {
    startTransition(() => {
      router.push(sortHrefs[column]);
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden">
      <table className="w-full text-left text-sm text-zinc-400">
        <thead className="bg-white/[0.02] border-b border-white/10">
          <tr>
            <th className="px-4 py-3 font-medium text-zinc-300">
              <SortHeader column="name" label="Name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            </th>
            <th className="px-4 py-3 font-medium text-zinc-300 text-right">
              <SortHeader column="total_paid" label="Total Paid" align="right" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            </th>
            <th className="px-4 py-3 font-medium text-zinc-300 text-right">
              <SortHeader column="total_owed" label="Total Owed" align="right" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            </th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className={`divide-y divide-white/10 transition-opacity duration-150 ${isPending ? "opacity-0" : "opacity-100"}`}>
          {clients.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-8 text-center text-zinc-500">
                No customers found. Sync from Xero/Quickbooks or add one manually.
              </td>
            </tr>
          ) : (
            clients.map(({ id, name, total_owed, total_paid, currency }) => {
              const formattedTotal = new Intl.NumberFormat(undefined, {
                style: "currency",
                currency,
              }).format(total_owed);

              const formattedPaid = new Intl.NumberFormat(undefined, {
                style: "currency",
                currency,
              }).format(total_paid);

              const assignedGroupIds = customerGroupsList
                .filter((cg) => cg.customer_id === id)
                .map((cg) => cg.group_id);

              return (
                <tr key={id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-zinc-200 mb-1.5">{name}</div>
                    <CustomerGroupsAssigner
                      customerId={id}
                      allGroups={groupsList}
                      assignedGroupIds={assignedGroupIds}
                    />
                  </td>
                  <td className="px-4 py-4 text-right align-top font-medium text-zinc-200">{formattedPaid}</td>
                  <td className="px-4 py-4 text-right align-top font-medium text-zinc-200">{formattedTotal}</td>
                  <td className="px-4 py-4 text-right align-top">
                    <Link href={`/customers/${id}`}>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-zinc-400 hover:text-zinc-100">
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
