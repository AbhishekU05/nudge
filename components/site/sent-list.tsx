"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Mail, ChevronDown, ChevronUp, User } from "lucide-react";
import { LocalTime } from "@/components/site/local-time";

type SentEmail = {
  id: string;
  subject: string;
  body_html: string;
  sent_at: string | null;
  clients: { name: string; email: string };
};

export function SentList({ sentEmails }: { sentEmails: SentEmail[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (sentEmails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/10 bg-zinc-900/50 mt-12">
        <Mail className="h-10 w-10 text-zinc-700 mb-3" />
        <h3 className="text-base font-medium text-zinc-200">No emails sent yet</h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-[300px]">
          When automated emails are sent out, they will appear here in your sent box.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-16 border-t border-white/10 pt-10">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold tracking-tight text-zinc-50">Sent Emails</h2>
        <span className="text-sm text-zinc-500">Last 30 emails sent</span>
      </div>

      <div className="space-y-3">
        {sentEmails.map((email) => {
          const isExpanded = expandedId === email.id;
          return (
            <div 
              key={email.id} 
              className="rounded-xl border border-white/5 bg-zinc-900/30 overflow-hidden transition-colors hover:border-white/10"
            >
              <button 
                onClick={() => setExpandedId(isExpanded ? null : email.id)}
                className="w-full text-left p-4 flex items-center justify-between focus:outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-500/10 p-2 rounded-full hidden sm:block">
                    <Mail className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-zinc-200">{email.clients?.name || "Unknown Client"}</span>
                      <span className="text-xs text-zinc-500 hidden sm:inline-block">
                        ({email.clients?.email || "No email"})
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 truncate max-w-[300px] sm:max-w-[400px]">
                      {email.subject}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-zinc-500">
                  <span className="text-xs whitespace-nowrap">
                    {email.sent_at ? formatDistanceToNow(new Date(email.sent_at), { addSuffix: true }) : "Unknown"}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 pt-0 border-t border-white/5 mt-2 bg-black/20">
                  <div className="py-4">
                    <div className="mb-4">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Subject</p>
                      <p className="text-sm font-medium text-zinc-200">{email.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Message</p>
                      <div 
                        className="text-sm text-zinc-300 whitespace-pre-wrap rounded-lg bg-zinc-950/50 p-4 border border-white/5"
                        dangerouslySetInnerHTML={{ __html: email.body_html }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
