"use client";

import { CustomerRecord, WorkflowStatus, getDaysOverdue } from "@/lib/types";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Calendar, AlertCircle } from "lucide-react";

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

const COLUMNS: { id: WorkflowStatus; title: string; color: string }[] = [
  { id: "outstanding", title: "Outstanding", color: "border-blue-500/20 bg-blue-500/10 text-blue-400" },
  { id: "overdue", title: "Overdue", color: "border-red-500/20 bg-red-500/10 text-red-400" },
  { id: "paid", title: "Paid In Full", color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
];

export function PipelineClient({ initialCustomers }: { initialCustomers: CustomerRecord[] }) {
  const getCustomersByStatus = (status: WorkflowStatus) => {
    return initialCustomers
      .filter((c) => c.workflow_status === status && !c.unsubscribed)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4">
      {COLUMNS.map((column) => {
        const colCustomers = getCustomersByStatus(column.id);
        const colTotal = colCustomers.reduce((acc, c) => {
          const remaining = Math.max(0, Number(c.amount_owed) - Number(c.amount_paid));
          return acc + (column.id === 'paid' ? Number(c.amount_paid) || Number(c.amount_owed) : remaining);
        }, 0);

        return (
          <div key={column.id} className="flex min-w-[320px] max-w-[320px] flex-col rounded-xl bg-white/[0.015] border border-white/5">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-zinc-100 flex items-center gap-2">
                  {column.title}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${column.color}`}>
                    {colCustomers.length}
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">{formatCurrency(colTotal)}</p>
              </div>
            </div>
            
            <div className="flex-1 p-3 min-h-[500px]">
              {colCustomers.map((customer) => {
                const remaining = Math.max(0, Number(customer.amount_owed) - Number(customer.amount_paid));
                const displayAmount = column.id === 'paid' ? Number(customer.amount_paid) || Number(customer.amount_owed) : remaining;
                const daysOverdue = getDaysOverdue(customer);

                return (
                  <div key={customer.id} className="mb-3 last:mb-0 transition-shadow shadow-sm hover:border-white/20">
                    <Card className="bg-[#1c1c1e] border-white/10 p-4 rounded-lg">
                      <Link href={`/customers/${customer.id}`} className="block">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-zinc-200 text-sm line-clamp-1">{customer.recipient_name}</h4>
                          <span className="font-semibold text-zinc-100 text-sm">{formatCurrency(displayAmount, customer.currency)}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-zinc-500 mt-3">
                          {customer.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(customer.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                          {daysOverdue !== null && daysOverdue > 0 && column.id !== 'paid' && (
                            <div className="flex items-center gap-1 text-red-400">
                              <AlertCircle className="h-3 w-3" />
                              {daysOverdue}d late
                            </div>
                          )}
                        </div>
                      </Link>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
