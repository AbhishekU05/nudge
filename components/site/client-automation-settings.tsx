"use client";

import { useState } from "react";
import { Zap, Clock, PauseCircle, PlayCircle, Settings2, ShieldCheck } from "lucide-react";
import { useFormStatus } from "react-dom";

import { ClientRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { enableAutomation } from "@/app/actions/customers";
import { pauseReminder, resumeReminder } from "@/app/actions/reminders";

function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingText || "Saving..." : children}
    </Button>
  );
}

export function ClientAutomationSettings({ client }: { client: ClientRecord }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-zinc-400" />
          <h2 className="text-xl font-medium text-zinc-100">Automation Settings</h2>
        </div>
        <div>
          {client.active ? (
            <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Active
            </Badge>
          ) : (
            <Badge variant="muted" className="bg-zinc-800 text-zinc-400 border-zinc-700">
              Inactive
            </Badge>
          )}
        </div>
      </div>

      {!client.active && !isEditing && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl">
          <Zap className="h-8 w-8 text-zinc-600 mb-3" />
          <h3 className="text-sm font-medium text-zinc-300">Automated Reminders</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-[200px]">
            Send statement-style email reminders on a schedule.
          </p>
          <Button 
            className="mt-4 gap-2" 
            variant="secondary" 
            onClick={() => setIsEditing(true)}
          >
            <PlayCircle className="h-4 w-4" />
            Enable Automation
          </Button>
        </div>
      )}

      {(client.active || isEditing) && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-zinc-500" />
                <p className="text-xs font-medium text-zinc-400">Frequency</p>
              </div>
              <p className="text-sm text-zinc-200">Every {client.reminder_frequency_days} days</p>
            </div>
            
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-4 w-4 text-zinc-500" />
                <p className="text-xs font-medium text-zinc-400">Auto Approve</p>
              </div>
              <p className="text-sm text-zinc-200">{client.auto_approve ? "Yes" : "Requires Approval"}</p>
            </div>
          </div>

          {isEditing ? (
            <form 
              action={enableAutomation} 
              className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4"
              onSubmit={() => setTimeout(() => setIsEditing(false), 500)}
            >
              <input type="hidden" name="client_id" value={client.id} />
              <div className="space-y-2">
                <Label htmlFor="reminder_frequency_days">Remind every (days)</Label>
                <Input 
                  id="reminder_frequency_days" 
                  name="reminder_frequency_days" 
                  type="number" 
                  min="1" 
                  defaultValue={client.reminder_frequency_days} 
                  className="bg-black/40 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto_approve">Auto Approve</Label>
                <select 
                  id="auto_approve" 
                  name="auto_approve" 
                  defaultValue={client.auto_approve ? "true" : "false"} 
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="false">No, I want to approve them (Queue)</option>
                  <option value="true">Yes, send automatically</option>
                </select>
              </div>
              
              <div className="flex gap-2 justify-end pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <SubmitButton>Save Settings</SubmitButton>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3 pt-2">
              <form action={async () => {
                await pauseReminder(client.id);
              }}>
                <Button type="submit" variant="secondary" className="gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                  <PauseCircle className="h-4 w-4" />
                  Pause
                </Button>
              </form>
              
              <Button variant="secondary" className="gap-2" onClick={() => setIsEditing(true)}>
                <Settings2 className="h-4 w-4" />
                Configure
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
