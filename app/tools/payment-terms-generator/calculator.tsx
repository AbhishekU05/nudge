"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PaymentTermsGenerator() {
  const [projectType, setProjectType] = useState('fixed');
  const [projectSize, setProjectSize] = useState('small');
  const [industry, setIndustry] = useState('');

  return (
    <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm">
      
        <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Project Type</label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="hourly">Hourly / Retainer</SelectItem>
                  <SelectItem value="milestone">Milestone Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Project Size</label>
              <Select value={projectSize} onValueChange={setProjectSize}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (&lt;$2k)</SelectItem>
                  <SelectItem value="medium">Medium ($2k-$10k)</SelectItem>
                  <SelectItem value="large">Large (&gt;$10k)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Industry (Optional)</label>
              <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Design, Dev" />
            </div>
        </div>
        
      
        {projectType ? (
          <div className="mt-8 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Your Payment Terms:</h3>
            <div className="text-zinc-300 whitespace-pre-wrap font-mono text-sm leading-relaxed p-4 bg-black/30 rounded-lg border border-white/5">
              {projectType === 'fixed' && projectSize === 'small' ? `Payment is due in full within 14 days of invoice receipt. Work will commence upon signing of this agreement.` : 
               projectType === 'fixed' ? `A 50% non-refundable deposit is required to secure a place in the production schedule. The remaining 50% is due upon project completion, prior to final asset handover. Invoices are Net 15.` :
               projectType === 'hourly' ? `Invoices will be generated on the 1st of each month for the hours worked in the preceding month. Payment is due Net 15. Work may be paused if invoices age past 30 days.` :
               `A 30% upfront deposit is required to commence work. Subsequent payments of 30% and 40% will be tied to agreed-upon project milestones. All milestone invoices are due Net 15.`}
              <br/><br/>
              Late Payments: Any invoice outstanding past its due date will incur a late fee of 1.5% per month (or the maximum allowed by law) on the outstanding balance. We reserve the right to pause ongoing work until past-due balances are settled.
            </div>
          </div>
        ) : null}
        
    </div>
  );
}
