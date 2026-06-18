"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

export function CollectionsROICalculator() {
  const [hours, setHours] = useState('5');
  const [rate, setRate] = useState('100');
  const [recoveryRate, setRecoveryRate] = useState('90');

  return (
    <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm">
      
        <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Hours/Month Chasing</label>
              <Input type="number" value={hours} onChange={e => setHours(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Your Hourly Rate ($)</label>
              <Input type="number" value={rate} onChange={e => setRate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Current Recovery %</label>
              <Input type="number" value={recoveryRate} onChange={e => setRecoveryRate(e.target.value)} />
            </div>
        </div>
        
      
        {hours && rate ? (
          <div className="mt-8 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Your Collections ROI:</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-zinc-800/50 border border-white/10 text-center">
                <div className="text-2xl font-bold text-zinc-200">${(parseFloat(hours) * parseFloat(rate) * 12).toLocaleString()}</div>
                <div className="text-xs text-zinc-400 mt-1">Annual Cost of Manual Follow-ups</div>
              </div>
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="text-2xl font-bold text-emerald-400">${((parseFloat(hours) * parseFloat(rate) * 12) - (29 * 12)).toLocaleString()}</div>
                <div className="text-xs text-emerald-300/70 mt-1">Annual Savings with Duely ($29/mo)</div>
              </div>
            </div>
          </div>
        ) : null}
        
    </div>
  );
}
