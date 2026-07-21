"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Mail, Check, X, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { approveDraft, deleteDraft, deleteDrafts, updateDraftContent } from "@/app/actions/drafts";

type Draft = {
  id: string;
  subject: string;
  body_html: string;
  created_at: string;
  status?: string;
  action_type?: string;
  action_payload?: Record<string, unknown>;
  clients: { name: string; email: string };
};

// approveDraft claims a row into "sending" before handing the email to Resend, and
// releases it back to "draft" if the send fails. A row left here means the process
// died mid-send: the email may or may not have gone out. Show it rather than let it
// vanish from both the queue and the sent list - re-approving is safe, because the
// send carries an idempotency key that stops Resend delivering twice.
const isSending = (draft: Draft) => draft.status === "sending";

export function DraftList({ initialDrafts, policyNames = {} }: { initialDrafts: Draft[]; policyNames?: Record<string, string> }) {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(drafts[0] || null);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Multi-select for bulk-discarding drafts straight from the sidebar (e.g. all
  // late-fee drafts under one policy). Empty set = nothing selected.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editSubject, setEditSubject] = useState(drafts[0]?.subject || "");
  const [editBody, setEditBody] = useState(drafts[0]?.body_html.replace(/<br\s*\/?>/gi, '\n') || "");
  const [editFeeAmount, setEditFeeAmount] = useState<number>(Number(drafts[0]?.action_payload?.fee_amount || 0));
  const [editDueDate, setEditDueDate] = useState<string>(String(drafts[0]?.action_payload?.due_date || ""));

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/10 bg-zinc-900/50">
        <Mail className="h-12 w-12 text-zinc-700 mb-4" />
        <h3 className="text-lg font-medium text-zinc-200">No pending drafts</h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-[300px]">
          You have no statement emails waiting for approval. New drafts will appear here when generated.
        </p>
      </div>
    );
  }

  const handleApprove = async () => {
    if (!selectedDraft) return;
    setIsApproving(true);
    
    // We should ideally use useTransition or formAction but an async call is fine here
    try {
      let payload: { subject: string; body_html: string; action_payload?: Record<string, unknown> } | undefined = undefined;
      if (isEditingDraft) {
        payload = { subject: editSubject, body_html: editBody.replace(/\n/g, '<br>') };
        if (selectedDraft.action_type === "late_fee") {
          payload.action_payload = { fee_amount: editFeeAmount, due_date: editDueDate };
        }
      }

      const res = await approveDraft(selectedDraft.id, payload);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Email sent successfully!");
        setDrafts(drafts.filter(d => d.id !== selectedDraft.id));
        setSelectedDraft(drafts.find(d => d.id !== selectedDraft.id) || null);
        setSelectedIds(prev => { const next = new Set(prev); next.delete(selectedDraft.id); return next; });
      }
    } catch {
      toast.error("Failed to approve draft.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDraft) return;
    setIsDeleting(true);
    
    try {
      const res = await deleteDraft(selectedDraft.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Draft discarded.");
        setDrafts(drafts.filter(d => d.id !== selectedDraft.id));
        setSelectedDraft(drafts.find(d => d.id !== selectedDraft.id) || null);
        setSelectedIds(prev => { const next = new Set(prev); next.delete(selectedDraft.id); return next; });
      }
    } catch {
      toast.error("Failed to discard draft.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedDraft) return;
    setIsSaving(true);
    
    try {
      const updatedBodyHtml = editBody.replace(/\n/g, '<br>');
      let updatedPayload = undefined;
      if (selectedDraft.action_type === "late_fee") {
        updatedPayload = { fee_amount: editFeeAmount, due_date: editDueDate };
      }
      const res = await updateDraftContent(selectedDraft.id, editSubject, updatedBodyHtml, updatedPayload);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Draft saved.");
        setIsEditingDraft(false);
        // Update local state
        const newActionPayload = updatedPayload 
          ? { ...selectedDraft.action_payload, ...updatedPayload } 
          : selectedDraft.action_payload;
        const updatedDraft = { ...selectedDraft, subject: editSubject, body_html: updatedBodyHtml, action_payload: newActionPayload };
        setSelectedDraft(updatedDraft);
        setDrafts(drafts.map(d => d.id === updatedDraft.id ? updatedDraft : d));
      }
    } catch {
      toast.error("Failed to save draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Select-all / clear for a group of ids: if all are already selected clicking
  // clears them, otherwise it selects the whole group. Used by the section and
  // per-policy headers.
  const toggleGroup = (ids: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = ids.length > 0 && ids.every(id => next.has(id));
      ids.forEach(id => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await deleteDrafts(ids);
      if (res.error) {
        toast.error(res.error);
      } else {
        const removed = new Set(ids);
        const remaining = drafts.filter(d => !removed.has(d.id));
        setDrafts(remaining);
        if (selectedDraft && removed.has(selectedDraft.id)) {
          setSelectedDraft(remaining[0] || null);
        }
        setSelectedIds(new Set());
        toast.success(ids.length === 1 ? "Draft discarded." : `${ids.length} drafts discarded.`);
      }
    } catch {
      toast.error("Failed to discard drafts.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // A tri-state checkbox for a group of ids: filled when all are selected, a
  // dash when only some are, empty otherwise.
  const groupCheckbox = (ids: string[], label: string) => {
    const allSelected = ids.length > 0 && ids.every(id => selectedIds.has(id));
    const someSelected = ids.some(id => selectedIds.has(id));
    return (
      <button
        type="button"
        aria-label={allSelected ? `Deselect ${label}` : `Select ${label}`}
        onClick={() => toggleGroup(ids)}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${allSelected ? 'bg-indigo-500 border-indigo-500 text-white' : someSelected ? 'bg-indigo-500/30 border-indigo-500/50' : 'border-white/20 hover:border-white/40'}`}
      >
        {allSelected ? <Check className="h-3 w-3" /> : someSelected ? <span className="h-0.5 w-2 rounded bg-white" /> : null}
      </button>
    );
  };

  const renderDraftButton = (draft: Draft) => {
    const isSelected = selectedIds.has(draft.id);
    return (
      <div key={draft.id} className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={isSelected ? "Deselect draft" : "Select draft"}
          onClick={() => toggleSelect(draft.id)}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/20 hover:border-white/40'}`}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </button>
        <button
          onClick={() => {
            setSelectedDraft(draft);
            setEditSubject(draft.subject);
            setEditBody(draft.body_html.replace(/<br\s*\/?>/gi, '\n'));
            setEditFeeAmount(Number(draft.action_payload?.fee_amount || 0));
            setEditDueDate(String(draft.action_payload?.due_date || ""));
            setIsEditingDraft(false);
          }}
          className={`flex-1 min-w-0 text-left p-3 rounded-xl transition-colors ${selectedDraft?.id === draft.id ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}`}
        >
          <div className="flex justify-between items-start mb-1 gap-2">
            <span className={`font-medium text-sm truncate ${selectedDraft?.id === draft.id ? 'text-indigo-300' : 'text-zinc-200'}`}>{draft.clients?.name || "Unknown"}</span>
            <span className="text-[10px] text-zinc-500 shrink-0">{formatDistanceToNow(new Date(draft.created_at))} ago</span>
          </div>
          <p className="text-xs text-zinc-400 truncate">{draft.subject}</p>
          {isSending(draft) && (
            <span className="mt-1.5 inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
              Interrupted while sending
            </span>
          )}
        </button>
      </div>
    );
  };

  // Split the flat queue into the three automation kinds. Statement and invoice
  // reminders share action_type "email" and are told apart by whether the draft
  // is tied to a specific invoice (action_payload.invoice_id). Late-fee drafts
  // carry action_type "late_fee" and are further bucketed by their policy so the
  // approver sees which policy each fee came from.
  const statementDrafts: Draft[] = [];
  const invoiceDrafts: Draft[] = [];
  const lateFeeGroups = new Map<string, Draft[]>();
  for (const draft of drafts) {
    if (draft.action_type === "late_fee") {
      const policyId = String(draft.action_payload?.policy_id ?? "__unknown__");
      const bucket = lateFeeGroups.get(policyId) ?? [];
      bucket.push(draft);
      lateFeeGroups.set(policyId, bucket);
    } else if (draft.action_payload?.invoice_id) {
      invoiceDrafts.push(draft);
    } else {
      statementDrafts.push(draft);
    }
  }
  const statementIds = statementDrafts.map(d => d.id);
  const invoiceIds = invoiceDrafts.map(d => d.id);
  const lateFeeIds = [...lateFeeGroups.values()].flat().map(d => d.id);

  const groupHeader = (label: string, ids: string[]) => (
    <div className="flex items-center gap-2 px-2 pt-1 pb-0.5">
      {groupCheckbox(ids, label)}
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="text-[10px] text-zinc-600">{ids.length}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[700px]">
      {/* List Sidebar */}
      <div className="col-span-1 rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 bg-white/[0.02]">
          <h2 className="font-medium text-zinc-200">Approval Queue</h2>
          <p className="text-xs text-zinc-500 mt-1">{drafts.length} emails in queue</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {statementDrafts.length > 0 && (
            <div className="space-y-1">
              {groupHeader("Statement Automations", statementIds)}
              {statementDrafts.map(renderDraftButton)}
            </div>
          )}

          {invoiceDrafts.length > 0 && (
            <div className="space-y-1">
              {groupHeader("Invoice Automations", invoiceIds)}
              {invoiceDrafts.map(renderDraftButton)}
            </div>
          )}

          {lateFeeGroups.size > 0 && (
            <div className="space-y-2">
              {groupHeader("Late Fees", lateFeeIds)}
              {[...lateFeeGroups.entries()].map(([policyId, bucket]) => {
                const policyLabel = policyNames[policyId] || "Late Fee Policy";
                return (
                  <div key={policyId} className="space-y-1">
                    <div className="flex items-center gap-2 px-2 pl-3">
                      {groupCheckbox(bucket.map(d => d.id), policyLabel)}
                      <span className="text-[11px] font-medium text-zinc-400 truncate">{policyLabel}</span>
                      <span className="text-[10px] text-zinc-600">{bucket.length}</span>
                    </div>
                    {bucket.map(renderDraftButton)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="border-t border-white/10 bg-white/[0.02] p-3 flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-400">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <Button variant="secondary" className="h-8 px-2.5 text-xs text-zinc-300" onClick={() => setSelectedIds(new Set())} disabled={isBulkDeleting}>
                Clear
              </Button>
              <Button variant="secondary" className="h-8 px-2.5 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                {isBulkDeleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Pane */}
      <div className="col-span-1 md:col-span-2 rounded-2xl border border-white/10 bg-zinc-900/50 flex flex-col overflow-hidden">
        {selectedDraft ? (
          <>
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-start">
              <div>
                {isEditingDraft ? (
                  <h2 className="text-lg font-medium text-zinc-100 mb-1">Editing Draft</h2>
                ) : (
                  <h2 className="text-lg font-medium text-zinc-100">{selectedDraft.subject}</h2>
                )}
                <p className="text-sm text-zinc-400 mt-1">To: <span className="text-zinc-300">{selectedDraft.clients?.email}</span></p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={handleDelete} disabled={isDeleting || isApproving || isSaving}>
                  <X className="w-4 h-4 mr-2" />
                  Discard
                </Button>
                {isEditingDraft ? (
                  <>
                    <Button variant="secondary" className="text-zinc-300" onClick={() => setIsEditingDraft(false)} disabled={isDeleting || isApproving || isSaving}>
                      Cancel
                    </Button>
                    <Button variant="secondary" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20" onClick={handleSaveDraft} disabled={isDeleting || isApproving || isSaving}>
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" className="text-zinc-300" onClick={() => setIsEditingDraft(true)} disabled={isDeleting || isApproving || isSaving}>
                    Edit Email
                  </Button>
                )}
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleApprove} disabled={isDeleting || isApproving || isSaving}>
                  <Check className="w-4 h-4 mr-2" />
                  {isEditingDraft ? "Save & Send" : "Approve & Send"}
                </Button>
              </div>
            </div>
            
            {isSending(selectedDraft) && (
              <div className="px-6 py-3 border-b border-amber-500/20 bg-amber-500/5">
                <p className="text-sm text-amber-400 font-medium">Interrupted while sending</p>
                <p className="text-xs text-zinc-400 mt-1">
                  This send did not finish, so we can&apos;t confirm whether it reached{" "}
                  {selectedDraft.clients?.email}. You can approve it again — the client will not
                  receive a duplicate. If it was only just sent, give it a couple of minutes
                  first, in case it is still on its way.
                </p>
              </div>
            )}

            <div className="flex-1 p-8 overflow-y-auto bg-zinc-950/50">
              <div className="max-w-2xl mx-auto bg-zinc-900 border border-white/10 rounded-lg p-8 shadow-sm">
                {isEditingDraft ? (
                  <div className="space-y-4">
                    {selectedDraft.action_type === "late_fee" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Late Fee Amount</label>
                          <Input 
                            type="number"
                            value={editFeeAmount}
                            onChange={(e) => setEditFeeAmount(Number(e.target.value))}
                            className="bg-zinc-950 border-white/10 text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-400 mb-1 block">Due Date (Optional)</label>
                          <Input 
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="bg-zinc-950 border-white/10 text-zinc-200"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Subject</label>
                      <Input 
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="bg-zinc-950 border-white/10 text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Body</label>
                      <Textarea 
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="min-h-[300px] bg-zinc-950 border-white/10 text-zinc-200 resize-y"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    {selectedDraft.action_type === "late_fee" && (
                      <div className="mb-6 p-4 rounded-xl border border-white/10 bg-zinc-950 flex gap-6 text-sm">
                        <div>
                          <span className="text-zinc-500 block mb-1">Late Fee</span>
                          <span className="text-zinc-200 font-medium">${String(selectedDraft.action_payload?.fee_amount || 0)}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block mb-1">Due Date</span>
                          <span className="text-zinc-200 font-medium">{String(selectedDraft.action_payload?.due_date || "Default Terms")}</span>
                        </div>
                      </div>
                    )}
                    <div 
                      className="prose prose-sm prose-invert max-w-none text-zinc-300"
                      dangerouslySetInnerHTML={{ __html: selectedDraft.body_html }}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Select a draft to preview
          </div>
        )}
      </div>
    </div>
  );
}
