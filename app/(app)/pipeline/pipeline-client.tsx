"use client";

import { CustomerRecord } from "@/lib/types";
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

const COLUMNS = [
  { id: "outstanding" as const, title: "Outstanding", color: "border-blue-500/20 bg-blue-500/10 text-blue-400" },
  { id: "overdue" as const, title: "Overdue", color: "border-red-500/20 bg-red-500/10 text-red-400" },
  { id: "paid" as const, title: "Paid In Full", color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
];

type PipelineBucket = { rows: CustomerRecord[]; count: number; total: number };

export function PipelineClient({
  pipelines,
  currency = "USD",
}: {
  pipelines: { outstanding: PipelineBucket; overdue: PipelineBucket; paid: PipelineBucket };
  currency?: string;
}) {
  return (
    <div className="flex h-full justify-center gap-6 overflow-x-auto pb-4">
      {COLUMNS.map((column) => {
        const colData = pipelines[column.id];

        return (
          <div key={column.id} className="flex min-w-[320px] max-w-[320px] flex-col rounded-xl bg-white/[0.015] border border-white/5">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-zinc-100 flex items-center gap-2">
                  {column.title}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${column.color}`}>
                    {colData.count}
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">{formatCurrency(colData.total, currency)}</p>
              </div>
            </div>

            <div className="flex-1 p-3 min-h-[500px]">
              {colData.rows.map((customer) => {
                // Outstanding/overdue display the remaining balance; paid displays the invoice total.
                const displayAmount = column.id === "paid" ? Number(customer.amount_owed) || 0 : (customer.remaining ?? 0);
                const daysOverdue = customer.days_overdue ?? 0;

                return (
                  <div key={customer.id} className="mb-3 last:mb-0 transition-shadow shadow-sm hover:border-white/20">
                    <Card className="bg-[#1c1c1e] border-white/10 p-4 rounded-lg">
                      {/* Rows come from get_pipeline_snapshot, where `id` is the invoice id
                          (the customer is `customer_id`). Link to the invoice, like the
                          dashboard pipeline widget does. */}
                      <Link href={`/invoices/${customer.id}`} className="block group">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors line-clamp-1">{customer.recipient_name || "Unknown"}</h4>
                          <span className="font-medium text-zinc-100 whitespace-nowrap">{formatCurrency(displayAmount, currency)}</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-zinc-500 mt-3">
                          {customer.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(customer.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                          {daysOverdue > 0 && column.id !== 'paid' && (
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
              {colData.count > colData.rows.length && (
                <div className="text-center pt-2">
                  <span className="text-xs text-zinc-500">+{colData.count - colData.rows.length} more</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
