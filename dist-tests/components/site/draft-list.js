"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftList = DraftList;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const sonner_1 = require("sonner");
const date_fns_1 = require("date-fns");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const textarea_1 = require("@/components/ui/textarea");
const drafts_1 = require("@/app/actions/drafts");
function DraftList({ initialDrafts }) {
    const [drafts, setDrafts] = (0, react_1.useState)(initialDrafts);
    const [selectedDraft, setSelectedDraft] = (0, react_1.useState)(drafts[0] || null);
    const [isApproving, setIsApproving] = (0, react_1.useState)(false);
    const [isDeleting, setIsDeleting] = (0, react_1.useState)(false);
    const [isSaving, setIsSaving] = (0, react_1.useState)(false);
    const [isEditingDraft, setIsEditingDraft] = (0, react_1.useState)(false);
    const [editSubject, setEditSubject] = (0, react_1.useState)("");
    const [editBody, setEditBody] = (0, react_1.useState)("");
    (0, react_1.useEffect)(() => {
        if (selectedDraft) {
            setEditSubject(selectedDraft.subject);
            setEditBody(selectedDraft.body_html.replace(/<br\s*\/?>/gi, '\n'));
            setIsEditingDraft(false);
        }
    }, [selectedDraft]);
    if (drafts.length === 0) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/10 bg-zinc-900/50", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-12 w-12 text-zinc-700 mb-4" }), (0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-medium text-zinc-200", children: "No pending drafts" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-zinc-500 max-w-[300px]", children: "You have no statement emails waiting for approval. New drafts will appear here when generated." })] }));
    }
    const handleApprove = async () => {
        if (!selectedDraft)
            return;
        setIsApproving(true);
        // We should ideally use useTransition or formAction but an async call is fine here
        try {
            const payload = isEditingDraft
                ? { subject: editSubject, body_html: editBody.replace(/\n/g, '<br>') }
                : undefined;
            const res = await (0, drafts_1.approveDraft)(selectedDraft.id, payload);
            if (res.error) {
                sonner_1.toast.error(res.error);
            }
            else {
                sonner_1.toast.success("Email sent successfully!");
                setDrafts(drafts.filter(d => d.id !== selectedDraft.id));
                setSelectedDraft(drafts.find(d => d.id !== selectedDraft.id) || null);
            }
        }
        catch {
            sonner_1.toast.error("Failed to approve draft.");
        }
        finally {
            setIsApproving(false);
        }
    };
    const handleDelete = async () => {
        if (!selectedDraft)
            return;
        setIsDeleting(true);
        try {
            const res = await (0, drafts_1.deleteDraft)(selectedDraft.id);
            if (res.error) {
                sonner_1.toast.error(res.error);
            }
            else {
                sonner_1.toast.success("Draft discarded.");
                setDrafts(drafts.filter(d => d.id !== selectedDraft.id));
                setSelectedDraft(drafts.find(d => d.id !== selectedDraft.id) || null);
            }
        }
        catch {
            sonner_1.toast.error("Failed to discard draft.");
        }
        finally {
            setIsDeleting(false);
        }
    };
    const handleSaveDraft = async () => {
        if (!selectedDraft)
            return;
        setIsSaving(true);
        try {
            const updatedBodyHtml = editBody.replace(/\n/g, '<br>');
            const res = await (0, drafts_1.updateDraftContent)(selectedDraft.id, editSubject, updatedBodyHtml);
            if (res.error) {
                sonner_1.toast.error(res.error);
            }
            else {
                sonner_1.toast.success("Draft saved.");
                setIsEditingDraft(false);
                // Update local state
                const updatedDraft = { ...selectedDraft, subject: editSubject, body_html: updatedBodyHtml };
                setSelectedDraft(updatedDraft);
                setDrafts(drafts.map(d => d.id === updatedDraft.id ? updatedDraft : d));
            }
        }
        catch {
            sonner_1.toast.error("Failed to save draft.");
        }
        finally {
            setIsSaving(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 h-[700px]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "col-span-1 rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden flex flex-col", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-4 border-b border-white/10 bg-white/[0.02]", children: [(0, jsx_runtime_1.jsx)("h2", { className: "font-medium text-zinc-200", children: "Approval Queue" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-zinc-500 mt-1", children: [drafts.length, " emails in queue"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 overflow-y-auto p-2 space-y-1", children: drafts.map(draft => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => setSelectedDraft(draft), className: `w-full text-left p-3 rounded-xl transition-colors ${selectedDraft?.id === draft.id ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-start mb-1", children: [(0, jsx_runtime_1.jsx)("span", { className: `font-medium text-sm ${selectedDraft?.id === draft.id ? 'text-indigo-300' : 'text-zinc-200'}`, children: draft.clients?.name || "Unknown" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] text-zinc-500", children: [(0, date_fns_1.formatDistanceToNow)(new Date(draft.created_at)), " ago"] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-400 truncate", children: draft.subject })] }, draft.id))) })] }), (0, jsx_runtime_1.jsx)("div", { className: "col-span-1 md:col-span-2 rounded-2xl border border-white/10 bg-zinc-900/50 flex flex-col overflow-hidden", children: selectedDraft ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-start", children: [(0, jsx_runtime_1.jsxs)("div", { children: [isEditingDraft ? ((0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-medium text-zinc-100 mb-1", children: "Editing Draft" })) : ((0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-medium text-zinc-100", children: selectedDraft.subject })), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-zinc-400 mt-1", children: ["To: ", (0, jsx_runtime_1.jsx)("span", { className: "text-zinc-300", children: selectedDraft.clients?.email })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "secondary", className: "border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300", onClick: handleDelete, disabled: isDeleting || isApproving || isSaving, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-4 h-4 mr-2" }), "Discard"] }), isEditingDraft ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "secondary", className: "text-zinc-300", onClick: () => setIsEditingDraft(false), disabled: isDeleting || isApproving || isSaving, children: "Cancel" }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "secondary", className: "border-indigo-500/30 text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20", onClick: handleSaveDraft, disabled: isDeleting || isApproving || isSaving, children: "Save Changes" })] })) : ((0, jsx_runtime_1.jsx)(button_1.Button, { variant: "secondary", className: "text-zinc-300", onClick: () => setIsEditingDraft(true), disabled: isDeleting || isApproving || isSaving, children: "Edit Email" })), (0, jsx_runtime_1.jsxs)(button_1.Button, { className: "bg-emerald-500 hover:bg-emerald-600 text-white", onClick: handleApprove, disabled: isDeleting || isApproving || isSaving, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-4 h-4 mr-2" }), isEditingDraft ? "Save & Send" : "Approve & Send"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 p-8 overflow-y-auto bg-zinc-950/50", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-2xl mx-auto bg-zinc-900 border border-white/10 rounded-lg p-8 shadow-sm", children: isEditingDraft ? ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-xs text-zinc-400 mb-1 block", children: "Subject" }), (0, jsx_runtime_1.jsx)(input_1.Input, { value: editSubject, onChange: (e) => setEditSubject(e.target.value), className: "bg-zinc-950 border-white/10 text-zinc-200" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-xs text-zinc-400 mb-1 block", children: "Body" }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { value: editBody, onChange: (e) => setEditBody(e.target.value), className: "min-h-[300px] bg-zinc-950 border-white/10 text-zinc-200 resize-y" })] })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "prose prose-sm prose-invert max-w-none text-zinc-300", dangerouslySetInnerHTML: { __html: selectedDraft.body_html } })) }) })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "flex-1 flex items-center justify-center text-zinc-500", children: "Select a draft to preview" })) })] }));
}
