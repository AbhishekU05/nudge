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
  status?: string;
  delivery_status?: string | null;
  delivery_status_at?: string | null;
  delivery_detail?: string | null;
  clients: { name: string; email: string };
};

// Delivery is a separate axis from `status` (the draft lifecycle): a row can be
// status='sent' and delivery_status='bounced'. Resend confirms hand-off straight
// away and only reports a bounce or complaint hours later over the webhook, so
// "Sent" here means "accepted by Resend", not "it arrived".
const DELIVERY_BADGES: Record<string, { label: string; className: string; title: string }> = {
  sent: {
    label: "Sent",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    title: "Accepted by Resend. Delivery not confirmed yet.",
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    title: "Accepted by the recipient's mail server.",
  },
  delivery_delayed: {
    label: "Delayed",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    title: "The recipient's mail server deferred this message. Resend is still retrying.",
  },
  bounced: {
    label: "Bounced",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    title: "The recipient's mail server rejected this message. Automations for this address were paused.",
  },
  complained: {
    label: "Spam",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    title: "The recipient marked this as spam. Automations for this address were paused.",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    title: "Resend could not send this message.",
  },
};

function DeliveryBadge({ email }: { email: SentEmail }) {
  // A failed row never reached Resend at all, so it has no delivery status.
  if (email.status === "failed") {
    return (
      <span className="ml-2 inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
        Failed
      </span>
    );
  }

  // Gmail-sent mail produces no Resend webhooks, so there is nothing to report.
  // Say so rather than implying delivery we never confirmed.
  if (!email.delivery_status) {
    return (
      <span
        title="Sent via Gmail. Delivery events are not tracked for Gmail."
        className="ml-2 inline-flex items-center rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-500 border border-zinc-500/20"
      >
        Not tracked
      </span>
    );
  }

  const badge = DELIVERY_BADGES[email.delivery_status];
  if (!badge) return null;

  return (
    <span
      title={email.delivery_detail ? `${badge.title} — ${email.delivery_detail}` : badge.title}
      className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

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
                      <DeliveryBadge email={email} />
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
                    {email.delivery_detail && (
                      <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                        <p className="text-xs text-red-400 uppercase tracking-wider mb-1">
                          Delivery problem
                        </p>
                        <p className="text-sm text-zinc-300">{email.delivery_detail}</p>
                      </div>
                    )}
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
