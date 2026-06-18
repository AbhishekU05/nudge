"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function InvoiceFollowupGenerator() {
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [daysOverdue, setDaysOverdue] = useState('');
  const [tone, setTone] = useState('friendly');

  return (
    <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm">
      
        <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Client Name</label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Invoice Amount</label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 1500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Due Date</label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Days Overdue</label>
              <Input type="number" value={daysOverdue} onChange={e => setDaysOverdue(e.target.value)} placeholder="e.g. 7" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-300 mb-1">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly Reminder</SelectItem>
                  <SelectItem value="firm">Firm Follow-up</SelectItem>
                  <SelectItem value="final">Final Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
        
      
        {clientName && amount ? (
          <div className="mt-8 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Your ready-to-send email:</h3>
            <div className="text-zinc-300 whitespace-pre-wrap font-mono text-sm leading-relaxed p-4 bg-black/30 rounded-lg border border-white/5">
              Subject: {tone === 'friendly' ? 'Checking in on Invoice' : tone === 'firm' ? 'Overdue Invoice Follow-up' : 'URGENT: Final Notice for Overdue Invoice'}
              <br/><br/>
              Hi {clientName},<br/><br/>
              {tone === 'friendly' 
                ? `I hope you're having a great week! I'm just following up on the invoice for $${amount} that was due on ${dueDate || '[Date]'}. It looks like it's currently ${daysOverdue || 'a few'} days overdue. Please let me know if you need another copy of the invoice or if you have any questions.`
                : tone === 'firm'
                ? `I am writing to follow up on the outstanding invoice for $${amount}, which was due on ${dueDate || '[Date]'}. As it is now ${daysOverdue || 'several'} days past the due date, could you please provide an update on when we can expect payment?`
                : `This is a final notice regarding your invoice for $${amount}, which is now ${daysOverdue || 'significantly'} days overdue since ${dueDate || '[Date]'}. Please submit payment immediately to avoid further action. Let me know if there are any issues preventing payment.`
              }
              <br/><br/>
              Best regards,<br/>
              [Your Name]
            </div>
          </div>
        ) : null}
        
    </div>
  );
}
