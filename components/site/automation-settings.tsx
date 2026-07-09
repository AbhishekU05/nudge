"use client";

import { useState, useRef } from "react";
import { Zap, Clock, PauseCircle, PlayCircle, Settings2, ShieldCheck, Plus, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveAutomationSettings, pauseAutomation } from "@/app/actions/automation";
import { fetchCustomerEmailJit } from "@/app/actions/customers";

function SubmitButton({ children, pendingText, isDisabled }: { children: React.ReactNode; pendingText?: string; isDisabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || isDisabled}>
      {pending ? pendingText || "Saving..." : children}
    </Button>
  );
}

type Template = { subject: string; body_html: string; days_offset?: number };

interface AutomationSettingsProps {
  entityType: "client" | "invoice";
  entityId: string;
  active: boolean;
  autoApprove: boolean;
  reminderType: "recurring" | "sequence";
  reminderTemplates: Template[];
  targetEmail?: string | null;
  isAllowed?: boolean;
  clientId?: string;
  previewData?: Record<string, string>;
}

export function AutomationSettings({
  entityType,
  entityId,
  active,
  autoApprove,
  reminderType,
  reminderTemplates,
  targetEmail,
  isAllowed = true,
  clientId,
  previewData
}: AutomationSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [type, setType] = useState<"recurring" | "sequence">(reminderType || "recurring");
  const [isAutoApprove, setIsAutoApprove] = useState<boolean>(autoApprove);
  const [isFetchingEmail, setIsFetchingEmail] = useState(false);
  const defaultRecurring = [{
    subject: "Following up on your balance",
    body_html: "Hi {{company_name}} Team,\n\nI hope you're doing well.\n\nJust a quick and friendly reminder that you have a pending balance of {{currency}} {{amount_owed}}.\n\nHere are the details:\n{{invoice_details}}\n\nYou can view and pay your balance securely via your client portal here: {{portal_link}}\n\nPlease let me know if you have any questions.\n\nBest,\n{{sender_name}}\n{{sender_company}}",
    days_offset: 7
  }];

  const defaultSequence = [
    {
      subject: "Friendly Reminder: Payment Due",
      body_html: "Hi {{company_name}} Team,\n\nI hope you're doing well.\n\nThis is just a friendly reminder that you have a pending balance of {{currency}} {{amount_owed}}.\n\nHere are the details:\n{{invoice_details}}\n\nYou can easily settle this via your client portal here: {{portal_link}}\n\nThank you!\n\nBest,\n{{sender_name}}\n{{sender_company}}",
      days_offset: 7
    },
    {
      subject: "Following up: Overdue Balance",
      body_html: "Hi {{company_name}} Team,\n\nI hope you're having a good week.\n\nI'm following up regarding your outstanding balance of {{currency}} {{amount_owed}}. \n\n{{invoice_details}}\n\nPlease submit your payment via the portal at your earliest convenience: {{portal_link}}\n\nLet me know if you need any assistance.\n\nBest,\n{{sender_name}}\n{{sender_company}}",
      days_offset: 7
    },
    {
      subject: "Action Required: Overdue Account",
      body_html: "Hi {{company_name}} Team,\n\nI am writing to formally request payment for your past due balance of {{currency}} {{amount_owed}}.\n\n{{invoice_details}}\n\nPlease address this immediately by paying through your portal: {{portal_link}}\n\nIf we do not receive payment, we may need to temporarily suspend services. Please let us know when we can expect this.\n\nRegards,\n{{sender_name}}\n{{sender_company}}",
      days_offset: 7
    }
  ];

  const initialTemplates = reminderTemplates?.length > 0 
    ? reminderTemplates 
    : (reminderType === "sequence" ? defaultSequence : defaultRecurring);

  const cleanTemplates = initialTemplates.map((tpl: { subject: string; body_html: string; days_offset?: number }) => ({
    ...tpl,
    body_html: tpl.body_html
      .replace(/<\/?p>/g, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }));

  const [templates, setTemplates] = useState<Template[]>(cleanTemplates);
  const router = useRouter();

  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleEnableAutomation = async () => {
    const idToFetch = entityType === "client" ? entityId : clientId;
    if (!targetEmail && idToFetch) {
      setIsFetchingEmail(true);
      try {
        const res = await fetchCustomerEmailJit(idToFetch);
        if (res.success && res.email) {
          router.refresh();
        } else {
          setShowEmailPrompt(true);
        }
      } catch {
        setShowEmailPrompt(true);
      }
      setIsFetchingEmail(false);
    }
    setIsEditing(true);
  };

  const handleAddTemplate = () => {
    setTemplates([...templates, { subject: "", body_html: "", days_offset: 7 }]);
  };

  const handleRemoveTemplate = (index: number) => {
    setTemplates(templates.filter((_, i) => i !== index));
  };

  const handleUpdateTemplate = (index: number, field: keyof Template, value: string | number) => {
    const newTemplates = [...templates];
    newTemplates[index] = { ...newTemplates[index], [field]: value };
    setTemplates(newTemplates);
  };

  const handleSave = async (formData: FormData) => {
    const emailToUse = targetEmail?.trim() || emailInput.trim();
    if (!emailToUse) {
      alert("Automation save cancelled. An email address is required.");
      return;
    }
    
    if (emailInput.trim()) {
      formData.append("new_email", emailInput.trim());
    }

    formData.append("entity_type", entityType);
    formData.append("entity_id", entityId);
    formData.append("reminder_type", type);
    formData.append("reminder_templates", JSON.stringify(templates));
    
    try {
      await saveAutomationSettings(formData);
      setIsEditing(false);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error saving automation");
    }
  };

  const handlePause = async () => {
    await pauseAutomation(entityType, entityId);
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-zinc-400" />
          <h2 className="text-xl font-medium text-zinc-100">
            {entityType === "client" ? "Statement Automation" : "Invoice Automation"}
          </h2>
        </div>
        <div>
          {active ? (
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

      {!active && !isEditing && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl">
          <Zap className="h-8 w-8 text-zinc-600 mb-3" />
          <h3 className="text-sm font-medium text-zinc-300">Automated Reminders</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-[200px]">
            Send automated emails on a schedule or via a sequence.
          </p>
          {!isAllowed ? (
            <p className="mt-4 text-sm text-rose-400 font-medium bg-rose-500/10 px-3 py-1.5 rounded-md">
              Upgrade to a paid subscription to enable automations.
            </p>
          ) : (
            <Button 
              className="mt-4 gap-2" 
              variant="secondary" 
              onClick={handleEnableAutomation}
              disabled={isFetchingEmail}
            >
              <PlayCircle className="h-4 w-4" />
              {isFetchingEmail ? "Fetching email..." : "Enable Automation"}
            </Button>
          )}
        </div>
      )}

      {(active || isEditing) && !isAllowed && (
        <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 flex flex-col items-center text-center">
          <p className="text-sm font-medium text-rose-400 mb-2">
            Automations are paused. Upgrade to a paid subscription to resume sending reminders.
          </p>
          <Button variant="secondary" size="sm" onClick={handlePause}>
            Pause Automation
          </Button>
        </div>
      )}

      {(active || isEditing) && isAllowed && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-zinc-500" />
                <p className="text-xs font-medium text-zinc-400">Type</p>
              </div>
              <p className="text-sm text-zinc-200 capitalize">{isEditing ? type : reminderType}</p>
            </div>
            
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-4 w-4 text-zinc-500" />
                <p className="text-xs font-medium text-zinc-400">Auto Approve</p>
              </div>
              <p className="text-sm text-zinc-200">{(isEditing ? isAutoApprove : autoApprove) ? "Yes" : "Requires Approval"}</p>
            </div>
          </div>

          {isEditing ? (
            <form 
              ref={formRef}
              action={handleSave}
              className="space-y-6 rounded-xl border border-white/10 bg-black/20 p-4"
            >
              <div className="space-y-4 border-b border-white/10 pb-6">
                {(!targetEmail || showEmailPrompt) && (
                  <div className="space-y-2">
                    <Label htmlFor="new_email">Recipient Email <span className="text-red-400">*</span></Label>
                    <Input 
                      id="new_email"
                      name="new_email"
                      type="email" 
                      placeholder="client@example.com" 
                      required 
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="bg-black/40"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="auto_approve">Approval</Label>
                  <select 
                    id="auto_approve" 
                    name="auto_approve" 
                    value={isAutoApprove ? "true" : "false"} 
                    onChange={(e) => setIsAutoApprove(e.target.value === "true")}
                    className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="false">Queue emails for my review</option>
                    <option value="true">Send emails automatically</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Strategy</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-zinc-300">
                      <input 
                        type="radio" 
                        checked={type === "recurring"} 
                        onChange={() => {
                          setType("recurring");
                          setTemplates([templates[0] || defaultRecurring[0]]);
                        }} 
                      />
                      Recurring (Same email)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-300">
                      <input 
                        type="radio" 
                        checked={type === "sequence"} 
                        onChange={() => {
                          setType("sequence");
                          if (templates.length <= 1) {
                            setTemplates(defaultSequence);
                          }
                        }} 
                      />
                      Sequence (Multiple emails)
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-xs text-indigo-300">
                  {entityType === "client" 
                    ? "For Statement Automation, the first email is sent immediately. The timing below determines the schedule for consecutive emails."
                    : "For Invoice Automation, the first email's send time is calculated relative to the due date. If the calculated time has already elapsed, it will be sent immediately (in 5 mins)."}
                </div>
                {templates.map((tpl, idx) => (
                  <div key={idx} className="space-y-3 relative p-4 rounded-lg bg-white/[0.02] border border-white/5">
                    {type === "sequence" && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Email {idx + 1}</span>
                        {templates.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => handleRemoveTemplate(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {type === "recurring" ? (
                          <div className="space-y-1.5">
                            <Label>Send every (days)</Label>
                            <Input 
                              type="number" 
                              min="1" 
                              value={tpl.days_offset || 7} 
                              onChange={(e) => handleUpdateTemplate(idx, "days_offset", parseInt(e.target.value))}
                              className="bg-black/40"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <Label>Send after (days)</Label>
                            <Input 
                              type="number" 
                              min="1" 
                              value={tpl.days_offset || 7} 
                              onChange={(e) => handleUpdateTemplate(idx, "days_offset", parseInt(e.target.value))}
                              className="bg-black/40"
                            />
                          </div>
                        )}
                        
                        <div className="space-y-1.5">
                          <Label>Subject Line</Label>
                          <Input 
                            value={tpl.subject} 
                            onChange={(e) => handleUpdateTemplate(idx, "subject", e.target.value)}
                            className="bg-black/40"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label>Email Message</Label>
                          <Textarea 
                            value={tpl.body_html} 
                            onChange={(e) => handleUpdateTemplate(idx, "body_html", e.target.value)}
                            rows={8}
                            className="text-xs bg-black/40 resize-none"
                            placeholder="Type your plain text message here..."
                          />
                          <p className="text-[10px] text-zinc-500 mt-2">
                            Available variables: {"{{company_name}}"}, {"{{currency}}"}, {"{{amount_owed}}"}, {"{{portal_link}}"}, {"{{invoice_details}}"}, {"{{sender_name}}"}, {"{{sender_company}}"}
                            {entityType === "invoice" ? ", {{invoice_number}}" : ", {{invoice_count}}"}
                          </p>
                        </div>
                      </div>

                      {/* Live Preview */}
                      <div className="bg-black/40 rounded-lg p-5 border border-white/5 shadow-sm flex flex-col h-full overflow-hidden text-zinc-300 font-sans">
                        <div className="border-b border-white/10 pb-3 mb-3">
                          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Preview</p>
                          <p className="text-sm font-medium line-clamp-1 text-zinc-200">
                            {(() => {
                              let subject = tpl.subject || "Subject";
                              const dummy = previewData || {
                                "{{company_name}}": "Acme Corp", "{{currency}}": "USD", 
                                "{{amount_owed}}": "1,250.00", "{{portal_link}}": "https://duely.in/portal/123", 
                                "{{invoice_details}}": "- Invoice #INV-001 (USD 1,250.00)", "{{invoice_number}}": "INV-001", 
                                "{{invoice_count}}": "1", "{{sender_name}}": "Jane Doe", "{{sender_company}}": "Our Company"
                              };
                              Object.entries(dummy).forEach(([k, v]) => { subject = subject.replace(new RegExp(k, 'g'), v); });
                              return subject;
                            })()}
                          </p>
                        </div>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[300px] flex-1">
                          {tpl.body_html.split(/(\{\{[^}]+\}\})/).map((part, i) => {
                            if (part.startsWith("{{") && part.endsWith("}}")) {
                              const dummy = (previewData || {
                                "{{company_name}}": "Acme Corp", "{{currency}}": "USD", 
                                "{{amount_owed}}": "1,250.00", "{{portal_link}}": "https://duely.in/portal/123", 
                                "{{invoice_details}}": "- Invoice #INV-001 (USD 1,250.00)", "{{invoice_number}}": "INV-001", 
                                "{{invoice_count}}": "1", "{{sender_name}}": "Jane Doe", "{{sender_company}}": "Our Company"
                              }) as Record<string, string>;
                              const value = dummy[part] || part;
                              return <span key={i} className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 py-0.5 rounded font-medium text-xs">{value}</span>;
                            }
                            return part;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {type === "sequence" && (
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    className="w-full gap-2 border-dashed border-white/20"
                    onClick={handleAddTemplate}
                  >
                    <Plus className="h-4 w-4" /> Add Email to Sequence
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2 justify-end pt-4 border-t border-white/10 mt-6">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditing(false);
                    setType(reminderType || "recurring");
                    setIsAutoApprove(autoApprove);
                    setTemplates(cleanTemplates);
                  }}
                >
                  Cancel
                </Button>
                <SubmitButton isDisabled={(!targetEmail || showEmailPrompt) && !emailInput.trim()}>
                  Save Automation
                </SubmitButton>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3 pt-2">
              <Button type="button" variant="secondary" className="gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={handlePause}>
                <PauseCircle className="h-4 w-4" />
                Pause
              </Button>
              
              <Button type="button" variant="secondary" className="gap-2" onClick={handleEnableAutomation} disabled={isFetchingEmail}>
                <Settings2 className="h-4 w-4" />
                {isFetchingEmail ? "Loading..." : "Configure"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
