"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Mail, Check, X, Eye, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { approveDraft, deleteDraft } from "@/app/actions/drafts";

type Draft = {
  id: string;
  subject: string;
  body_html: string;
  created_at: string;
  clients: { name: string; email: string };
};

export function DraftList({ initialDrafts }: { initialDrafts: Draft[] }) {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(drafts[0] || null);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const res = await approveDraft(selectedDraft.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Email sent successfully!");
        setDrafts(drafts.filter(d => d.id !== selectedDraft.id));
        setSelectedDraft(drafts.find(d => d.id !== selectedDraft.id) || null);
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
      }
    } catch {
      toast.error("Failed to discard draft.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[700px]">
      {/* List Sidebar */}
      <div className="col-span-1 rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 bg-white/[0.02]">
          <h2 className="font-medium text-zinc-200">Approval Queue</h2>
          <p className="text-xs text-zinc-500 mt-1">{drafts.length} emails in queue</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {drafts.map(draft => (
            <button
              key={draft.id}
              onClick={() => setSelectedDraft(draft)}
              className={`w-full text-left p-3 rounded-xl transition-colors ${selectedDraft?.id === draft.id ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-medium text-sm ${selectedDraft?.id === draft.id ? 'text-indigo-300' : 'text-zinc-200'}`}>{draft.clients?.name || "Unknown"}</span>
                <span className="text-[10px] text-zinc-500">{formatDistanceToNow(new Date(draft.created_at))} ago</span>
              </div>
              <p className="text-xs text-zinc-400 truncate">{draft.subject}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Preview Pane */}
      <div className="col-span-1 md:col-span-2 rounded-2xl border border-white/10 bg-zinc-900/50 flex flex-col overflow-hidden">
        {selectedDraft ? (
          <>
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-start">
              <div>
                <h2 className="text-lg font-medium text-zinc-100">{selectedDraft.subject}</h2>
                <p className="text-sm text-zinc-400 mt-1">To: <span className="text-zinc-300">{selectedDraft.clients?.email}</span></p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={handleDelete} disabled={isDeleting || isApproving}>
                  <X className="w-4 h-4 mr-2" />
                  Discard
                </Button>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleApprove} disabled={isDeleting || isApproving}>
                  <Check className="w-4 h-4 mr-2" />
                  Approve & Send
                </Button>
              </div>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto bg-zinc-950/50">
              <div className="max-w-2xl mx-auto bg-white rounded-lg p-8 shadow-sm">
                <div 
                  className="prose prose-sm max-w-none text-zinc-800"
                  dangerouslySetInnerHTML={{ __html: selectedDraft.body_html }}
                />
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
