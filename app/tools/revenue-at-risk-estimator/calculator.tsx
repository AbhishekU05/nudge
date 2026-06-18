"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function RevenueAtRiskEstimator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState('10000');
  const [invoiceCount, setInvoiceCount] = useState('10');
  const [latePercent, setLatePercent] = useState('30');
  const [daysLate, setDaysLate] = useState('15');

  return (
    <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm">
      
        <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Monthly Revenue ($)</label>
              <Input type="number" value={monthlyRevenue} onChange={e => setMonthlyRevenue(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Average Invoices / Month</label>
              <Input type="number" value={invoiceCount} onChange={e => setInvoiceCount(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">% of Clients Who Pay Late</label>
              <Input type="number" value={latePercent} onChange={e => setLatePercent(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Average Days Late</label>
              <Input type="number" value={daysLate} onChange={e => setDaysLate(e.target.value)} />
            </div>
        </div>
        
      
        {monthlyRevenue ? (
          <div className="mt-8 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Your Risk Assessment:</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                <div className="text-2xl font-bold text-red-400">${(parseFloat(monthlyRevenue) * 12 * (parseFloat(latePercent)/100)).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                <div className="text-xs text-red-300/70 mt-1">Annual Revenue Delayed</div>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-2xl font-bold text-amber-400">${((parseFloat(monthlyRevenue) * (parseFloat(latePercent)/100)) * (parseFloat(daysLate)/30)).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                <div className="text-xs text-amber-300/70 mt-1">Working Capital Tied Up</div>
              </div>
              <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-center">
                <div className="text-2xl font-bold text-indigo-400">${(((parseFloat(monthlyRevenue) * (parseFloat(latePercent)/100)) * (parseFloat(daysLate)/30)) * 0.1).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                <div className="text-xs text-indigo-300/70 mt-1">Cost of Capital (Assuming 10%)</div>
              </div>
            </div>
          </div>
        ) : null}
        
    </div>
  );
}
