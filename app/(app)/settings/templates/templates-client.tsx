"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Edit2, Save, Trash2, MessageSquareText } from "lucide-react";

type Tone = "friendly" | "professional" | "firm";
type Stage = "first_reminder" | "second_reminder" | "final_notice";

interface Template {
  id: string;
  name: string;
  tone: Tone;
  stage: Stage;
  subject: string;
  body: string;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "1",
    name: "Gentle Nudge",
    tone: "friendly",
    stage: "first_reminder",
    subject: "Following up on Invoice #[Invoice Number]",
    body: "Hi [Client Name],\n\nHope you're having a great week! Just sending a quick friendly reminder about Invoice #[Invoice Number] for [Amount], which was due on [Due Date].\n\nIf you've already sent the payment, please disregard this message. If not, you can pay online here: [Payment Link]\n\nLet me know if you have any questions!\n\nBest,\n[Your Name]"
  },
  {
    id: "2",
    name: "Professional Check-in",
    tone: "professional",
    stage: "second_reminder",
    subject: "Action Required: Overdue Invoice #[Invoice Number]",
    body: "Dear [Client Name],\n\nThis is a follow-up regarding Invoice #[Invoice Number] for [Amount], which is now [Days] days overdue. \n\nPlease let us know when we can expect this payment to be processed. You can easily complete the payment via this link: [Payment Link].\n\nThank you for your prompt attention to this matter.\n\nRegards,\n[Your Name]"
  },
  {
    id: "3",
    name: "Final Demand",
    tone: "firm",
    stage: "final_notice",
    subject: "URGENT: Final Notice for Invoice #[Invoice Number]",
    body: "Hi [Client Name],\n\nDespite our previous reminders, Invoice #[Invoice Number] for [Amount] remains unpaid and is now significantly past due.\n\nWe require immediate payment to avoid further action. Please remit payment today via [Payment Link].\n\nIf you are experiencing financial difficulties, please contact us immediately so we can discuss a payment plan.\n\nSincerely,\n[Your Name]"
  }
];

export function TemplatesClient() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states for the currently edited template
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTone, setEditTone] = useState<Tone>("friendly");
  const [editStage, setEditStage] = useState<Stage>("first_reminder");

  const handleEdit = (t: Template) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditSubject(t.subject);
    setEditBody(t.body);
    setEditTone(t.tone);
    setEditStage(t.stage);
  };

  const handleSave = () => {
    setTemplates(prev => prev.map(t => {
      if (t.id === editingId) {
        return {
          ...t,
          name: editName,
          subject: editSubject,
          body: editBody,
          tone: editTone,
          stage: editStage
        };
      }
      return t;
    }));
    setEditingId(null);
    alert("Template saved successfully");
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
        <MessageSquareText className="h-5 w-5 shrink-0" />
        <p className="text-sm">
          Use variables like <strong className="font-mono bg-blue-500/20 px-1 py-0.5 rounded">[Client Name]</strong>, <strong className="font-mono bg-blue-500/20 px-1 py-0.5 rounded">[Amount]</strong>, and <strong className="font-mono bg-blue-500/20 px-1 py-0.5 rounded">[Due Date]</strong>. We will automatically inject the correct values when you draft an email.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {templates.map(template => (
          <Card key={template.id} className="bg-white/[0.02] border-white/10 flex flex-col h-full">
            {editingId === template.id ? (
              // EDIT MODE
              <>
                <CardHeader className="border-b border-white/5 pb-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Template Name</label>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-zinc-900 border-white/10 text-zinc-100" />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">Tone</label>
                        <select 
                          value={editTone} 
                          onChange={(e) => setEditTone(e.target.value as Tone)}
                          className="flex h-10 w-full items-center justify-between rounded-md border bg-zinc-900 border-white/10 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="friendly">Friendly</option>
                          <option value="professional">Professional</option>
                          <option value="firm">Firm</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">Stage</label>
                        <select 
                          value={editStage} 
                          onChange={(e) => setEditStage(e.target.value as Stage)}
                          className="flex h-10 w-full items-center justify-between rounded-md border bg-zinc-900 border-white/10 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="first_reminder">First Reminder</option>
                          <option value="second_reminder">Second Reminder</option>
                          <option value="final_notice">Final Notice</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1 space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Subject Line</label>
                    <Input value={editSubject} onChange={e => setEditSubject(e.target.value)} className="bg-zinc-900 border-white/10 text-zinc-100 font-medium" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Email Body</label>
                    <Textarea 
                      value={editBody} 
                      onChange={e => setEditBody(e.target.value)} 
                      className="bg-zinc-900 border-white/10 text-zinc-300 min-h-[200px] resize-none" 
                    />
                  </div>
                </CardContent>
                <div className="border-t border-white/5 p-4 flex justify-end gap-2 mt-auto">
                  <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                  <Button variant="primary" onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" /> Save Template
                  </Button>
                </div>
              </>
            ) : (
              // VIEW MODE
              <>
                <CardHeader className="border-b border-white/5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-zinc-100 text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1.5 flex gap-2">
                        <span className="capitalize bg-white/5 px-2 py-0.5 rounded-md text-xs">{template.tone}</span>
                        <span className="capitalize bg-white/5 px-2 py-0.5 rounded-md text-xs">{template.stage.replace('_', ' ')}</span>
                      </CardDescription>
                    </div>
                    <Button variant="ghost" onClick={() => handleEdit(template)} className="text-zinc-400 hover:text-zinc-100 h-8 w-8 p-0">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  <div className="mb-4">
                    <p className="text-xs text-zinc-500 mb-1">Subject Line</p>
                    <p className="text-sm font-medium text-zinc-200">{template.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Email Body</p>
                    <div className="text-sm text-zinc-400 whitespace-pre-wrap bg-white/[0.02] p-4 rounded-lg border border-white/5">
                      {template.body}
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
