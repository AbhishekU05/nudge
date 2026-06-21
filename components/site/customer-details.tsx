"use client";

/*
 * CustomerDrawer — expandable side-drawer for full customer workflow.
 * Houses: payment log, partial payment form, promise form, notes,
 * follow-up drafting, and automation controls.
 * All forms post to server actions via native form action=.
 */

import { useState } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Zap,
  Copy,
  Check,
  Link2,
  AlertCircle,
  Undo2,
  Trash2,
  ReceiptText,
  Phone,
  History,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  recordPartialPayment,
  recordPaymentPromise,
  saveInternalNotes,
  markFullyPaid,
  undoMarkAsPaid,
  correctAmountPaid,
  deleteCustomer,
  updateDueDate,
  logFollowUp,
  updateCustomerEmail,
} from "@/app/actions/customers";
import { FOLLOWUP_TEMPLATES } from "@/lib/followup-templates";
import { pauseReminder, resumeReminder } from "@/app/actions/reminders";
import { cn } from "@/lib/utils";
import type { CustomerRecord, FollowUpTone, FollowUpMethod, FollowUpOutcome } from "@/lib/types";
import { getRemainingBalance, getDaysOverdue } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
  }).format(Number(value));
}

type Tab = "timeline" | "payment" | "promise" | "followup" | "notes" | "automation";

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors",
        active
          ? "bg-white/[0.08] text-zinc-100"
          : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">
        {title}
      </p>
      {children}
    </div>
  );
}

function PaymentSourceBadge({ source }: { source: "user" | "customer" | "adjustment" }) {
  if (source === "customer") {
    return <Badge variant="success">Customer confirmed</Badge>;
  }

  if (source === "adjustment") {
    return <Badge variant="muted">Adjusted by you</Badge>;
  }

  return <Badge variant="default">Logged by you</Badge>;
}

function PaymentHistory({ customer }: { customer: CustomerRecord }) {
  const history = customer.payment_history ?? [];

  return (
    <Section title="Payment history">
      {history.length > 0 ? (
        <div className="space-y-2">
          {history.map((payment) => (
            <div
              key={payment.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-100">
                    {formatCurrency(Number(payment.amount), payment.currency)}
                  </p>
                  <PaymentSourceBadge source={payment.source} />
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  {new Date(payment.created_at).toLocaleString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <ReceiptText className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-zinc-600">
          Payments you record for this customer will appear here with the exact
          amount and timestamp.
        </div>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Payment tab
// ---------------------------------------------------------------------------
function PaymentTab({ customer }: { customer: CustomerRecord }) {
  const remaining = getRemainingBalance(customer);
  const paidPct =
    customer.amount_owed > 0
      ? Math.min(100, (Number(customer.amount_paid) / Number(customer.amount_owed)) * 100)
      : 0;
  const isFullyPaid = remaining <= 0;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-zinc-400">
            Paid:{" "}
            <span className="font-semibold text-zinc-100">
              {formatCurrency(Number(customer.amount_paid), customer.currency)}
            </span>
          </span>
          <span className="text-zinc-400">
            Remaining:{" "}
            <span className="font-semibold text-zinc-100">
              {formatCurrency(remaining, customer.currency)}
            </span>
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-right text-xs text-zinc-600">
          {paidPct.toFixed(0)}% collected of{" "}
          {formatCurrency(Number(customer.amount_owed), customer.currency)}
        </p>
      </div>

      {/* Edit due date */}
      <Section title="Due date">
        <form action={updateDueDate} className="flex items-center gap-2">
          <input type="hidden" name="customer_id" value={customer.id} />
          <Input
            type="date"
            name="due_date"
            defaultValue={customer.due_date ?? undefined}
            className="flex-1"
          />
          <Button type="submit" size="sm" variant="secondary">
            Save
          </Button>
        </form>
        <p className="mt-1.5 text-xs text-zinc-600">
          Leave blank to clear the due date.
        </p>
      </Section>

      {isFullyPaid ? (
        <div className="space-y-3">
          {/* Fully paid badge */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm",
              customer.client_paid_at
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                : "border-indigo-500/25 bg-indigo-500/10 text-indigo-100",
            )}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              {customer.client_paid_at ? (
                "Marked as paid by customer"
              ) : (
                "Marked as paid by you"
              )}
            </span>
          </div>
          {customer.client_paid_at && (
            <p className="text-xs text-zinc-600">
              Customer confirmed on{" "}
              {new Date(customer.client_paid_at).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}

          <PaymentHistory customer={customer} />

          {/* Undo */}
          <Section title="Undo payment">
            <form action={undoMarkAsPaid}>
              <input type="hidden" name="customer_id" value={customer.id} />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="w-full gap-1.5 text-zinc-400 hover:text-zinc-100"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Undo — reset to outstanding
              </Button>
            </form>
            <p className="mt-1.5 text-xs text-zinc-600">
              Resets amount paid to 0 and moves the customer back to your
              active pipeline.
            </p>
          </Section>

          {/* Correct amount */}
          <Section title="Correct amount">
            <form action={correctAmountPaid} className="space-y-2">
              <input type="hidden" name="customer_id" value={customer.id} />
              <Input
                name="new_amount_paid"
                inputMode="decimal"
                placeholder={`Correct amount (of ${formatCurrency(Number(customer.amount_owed), customer.currency)})`}
                required
              />
              <Button type="submit" variant="secondary" size="sm" className="w-full">
                Update amount
              </Button>
            </form>
          </Section>
        </div>
      ) : (
        <>
          {/* Record partial payment */}
          <Section title="Log payment">
            <form action={recordPartialPayment} className="space-y-3">
              <input type="hidden" name="customer_id" value={customer.id} />
              <div>
                <Label htmlFor={`pay_amount_${customer.id}`} className="sr-only">
                  Payment amount
                </Label>
                <Input
                  id={`pay_amount_${customer.id}`}
                  name="payment_amount"
                  inputMode="decimal"
                  placeholder={`Amount received (max ${formatCurrency(remaining, customer.currency)})`}
                  required
                />
              </div>
              <Button type="submit" size="sm" className="w-full">
                Record payment
              </Button>
            </form>
          </Section>

          <PaymentHistory customer={customer} />

          {/* Correct previously logged amount */}
          {Number(customer.amount_paid) > 0 && (
            <Section title="Correct amount paid">
              <form action={correctAmountPaid} className="space-y-2">
                <input type="hidden" name="customer_id" value={customer.id} />
                <Input
                  name="new_amount_paid"
                  inputMode="decimal"
                  defaultValue={String(customer.amount_paid)}
                  placeholder="Corrected amount"
                  required
                />
                <Button type="submit" variant="secondary" size="sm" className="w-full">
                  Update amount
                </Button>
              </form>
              <p className="mt-1.5 text-xs text-zinc-600">
                Overwrites the recorded amount and recalculates status.
              </p>
            </Section>
          )}

          {/* Mark fully paid shortcut */}
          <Section title="Mark as fully paid">
            <form action={markFullyPaid}>
              <input type="hidden" name="customer_id" value={customer.id} />
              <Button type="submit" variant="secondary" size="sm" className="w-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark fully paid
              </Button>
            </form>
          </Section>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Promise tab
// ---------------------------------------------------------------------------
function PromiseTab({ customer }: { customer: CustomerRecord }) {
  return (
    <div className="space-y-5">
      {customer.promised_date && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-200">
            Promised by {new Date(customer.promised_date).toLocaleDateString()}
          </p>
          {customer.promise_notes && (
            <p className="mt-2 text-amber-200/70">{customer.promise_notes}</p>
          )}
        </div>
      )}

      <Section title="Record payment promise">
        <form action={recordPaymentPromise} className="space-y-3">
          <input type="hidden" name="customer_id" value={customer.id} />
          <div>
            <Label htmlFor={`promised_date_${customer.id}`}>Promised by</Label>
            <Input
              id={`promised_date_${customer.id}`}
              name="promised_date"
              type="date"
              required
              className="mt-1.5"
              defaultValue={customer.promised_date ?? undefined}
            />
          </div>
          <div>
            <Label htmlFor={`promise_notes_${customer.id}`}>Notes (optional)</Label>
            <Textarea
              id={`promise_notes_${customer.id}`}
              name="promise_notes"
              placeholder="e.g. Will pay after invoice approval"
              maxLength={500}
              className="mt-1.5"
              defaultValue={customer.promise_notes ?? undefined}
            />
          </div>
          <Button type="submit" size="sm" className="w-full">
            <Clock className="h-3.5 w-3.5" />
            Save promise
          </Button>
        </form>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Follow-up drafting tab (template-based, no AI) + log follow-up form
// ---------------------------------------------------------------------------

const METHOD_OPTIONS: { value: FollowUpMethod; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "call", label: "Call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
];

const OUTCOME_OPTIONS: { value: FollowUpOutcome; label: string }[] = [
  { value: "no_response", label: "No response" },
  { value: "promise_made", label: "Promise made" },
  { value: "partial_payment", label: "Partial payment" },
  { value: "paid_in_full", label: "Paid in full" },
];

const METHOD_LABELS: Record<FollowUpMethod, string> = {
  email: "Email",
  call: "Call",
  whatsapp: "WhatsApp",
  other: "Other",
};

const OUTCOME_LABELS: Record<FollowUpOutcome, string> = {
  no_response: "No response",
  promise_made: "Promise made",
  partial_payment: "Partial payment",
  paid_in_full: "Paid in full",
};

const OUTCOME_COLORS: Record<FollowUpOutcome, string> = {
  no_response: "text-zinc-400",
  promise_made: "text-amber-300",
  partial_payment: "text-blue-300",
  paid_in_full: "text-emerald-300",
};

function FollowUpTimeline({ customer }: { customer: CustomerRecord }) {
  const history = customer.followup_history ?? [];

  return (
    <Section title="Follow-up history">
      {history.length > 0 ? (
        <div className="space-y-2">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">{METHOD_LABELS[entry.method]}</Badge>
                    <span className={cn("text-xs font-medium", OUTCOME_COLORS[entry.outcome])}>
                      {OUTCOME_LABELS[entry.outcome]}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="mt-1.5 text-sm text-zinc-300">{entry.note}</p>
                  )}
                  <p className="mt-1 text-xs text-zinc-600">
                    {new Date(entry.followup_date).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <History className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-zinc-600">
          Follow-ups you log will appear here as a timeline.
        </div>
      )}
    </Section>
  );
}

function FollowUpTab({ customer }: { customer: CustomerRecord }) {
  const daysOverdue = getDaysOverdue(customer);
  const remaining = getRemainingBalance(customer);
  const amountStr = formatCurrency(remaining, customer.currency);

  const [tone, setTone] = useState<FollowUpTone>("professional");
  const [editedDraft, setEditedDraft] = useState(
    () => FOLLOWUP_TEMPLATES["professional"](customer.recipient_name, amountStr, daysOverdue),
  );
  const [copied, setCopied] = useState(false);

  function handleToneChange(newTone: FollowUpTone) {
    setTone(newTone);
    setEditedDraft(FOLLOWUP_TEMPLATES[newTone](customer.recipient_name, amountStr, daysOverdue));
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tones: { value: FollowUpTone; label: string; desc: string }[] = [
    { value: "friendly", label: "Friendly", desc: "Warm & casual" },
    { value: "professional", label: "Professional", desc: "Neutral & clear" },
    { value: "firm", label: "Firm", desc: "Direct & assertive" },
  ];

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Log follow-up form */}
      <Section title="Log a follow-up">
        <form action={logFollowUp} className="space-y-3">
          <input type="hidden" name="customer_id" value={customer.id} />

          <div>
            <Label htmlFor={`followup_date_${customer.id}`}>Date</Label>
            <Input
              id={`followup_date_${customer.id}`}
              name="followup_date"
              type="date"
              defaultValue={today}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor={`followup_method_${customer.id}`}>Method</Label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {METHOD_OPTIONS.map((m) => (
                <label
                  key={m.value}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs text-zinc-400 transition-colors has-[:checked]:border-primary/40 has-[:checked]:bg-primary/10 has-[:checked]:text-indigo-200 hover:border-white/20"
                >
                  <input
                    type="radio"
                    name="method"
                    value={m.value}
                    defaultChecked={m.value === "email"}
                    className="sr-only"
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor={`followup_note_${customer.id}`}>Short note (optional)</Label>
            <Textarea
              id={`followup_note_${customer.id}`}
              name="note"
              placeholder="e.g. Left a voicemail, will call back tomorrow"
              maxLength={500}
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor={`followup_outcome_${customer.id}`}>Outcome</Label>
            <select
              id={`followup_outcome_${customer.id}`}
              name="outcome"
              defaultValue="no_response"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-white/20 focus:border-primary/40 focus:outline-none"
            >
              {OUTCOME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-zinc-900 text-zinc-300">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" size="sm" className="w-full gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            Log follow-up
          </Button>
        </form>
      </Section>

      {/* Follow-up timeline */}
      <FollowUpTimeline customer={customer} />

      {/* Draft message templates */}
      <Section title="Tone">
        <div className="grid grid-cols-3 gap-2">
          {tones.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleToneChange(t.value)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors",
                tone === t.value
                  ? "border-primary/40 bg-primary/10 text-indigo-200"
                  : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20",
              )}
            >
              <p className="text-xs font-semibold">{t.label}</p>
              <p className="mt-0.5 text-[10px] leading-none text-zinc-600">{t.desc}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Draft message">
        <div className="relative">
          <Textarea
            value={editedDraft}
            onChange={(e) => setEditedDraft(e.target.value)}
            rows={9}
            className="resize-none pr-20 font-mono text-xs leading-6 text-zinc-300"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-background/90 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-zinc-100"
          >
            {copied ? (
              <><Check className="h-3 w-3 text-emerald-400" /> Copied</>
            ) : (
              <><Copy className="h-3 w-3" /> Copy</>
            )}
          </button>
        </div>
        <p className="text-xs text-zinc-600">Edit freely — switching tone resets to template.</p>
      </Section>

      {customer.payment_link && (
        <a
          href={customer.payment_link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100"
        >
          <Link2 className="h-3.5 w-3.5" />
          Payment link attached
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes tab
// ---------------------------------------------------------------------------
function NotesTab({ customer }: { customer: CustomerRecord }) {
  return (
    <div className="space-y-4">
      <Section title="Internal notes">
        <form action={saveInternalNotes} className="space-y-3">
          <input type="hidden" name="customer_id" value={customer.id} />
          <Textarea
            name="internal_notes"
            placeholder="Notes about this customer — not sent to them."
            maxLength={2000}
            rows={8}
            defaultValue={customer.internal_notes ?? undefined}
          />
          <Button type="submit" size="sm" className="w-full">
            <FileText className="h-3.5 w-3.5" />
            Save notes
          </Button>
        </form>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Automation tab (demoted — "escalation" framing)
// ---------------------------------------------------------------------------
function AutomationTab({
  customer,
  isDevelopment,
}: {
  customer: CustomerRecord;
  isDevelopment: boolean;
}) {
  const isActive = customer.active && !customer.unsubscribed;
  // "Never configured" = no sends yet and currently inactive
  const neverConfigured = !customer.active && !customer.last_sent_at;

  if (customer.unsubscribed) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-zinc-400">
        This customer opted out of email reminders and cannot receive automated
        emails.
      </div>
    );
  }

  if (neverConfigured) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-zinc-400">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
            <p>
              Automated reminders are a{" "}
              <span className="font-medium text-zinc-300">
                backup escalation
              </span>{" "}
              — use them when manual follow-ups haven&apos;t worked. They email
              the customer on a schedule until you mark them as paid or stop the
              sequence.
            </p>
          </div>
        </div>
        <a
          href={`/reminders/new?customer_id=${customer.id}`}
          className="block"
        >
          <Button className="w-full gap-2">
            <Zap className="h-3.5 w-3.5" />
            Set up automation
          </Button>
        </a>
        <p className="text-xs text-zinc-600">
          Choose your email tone, add a payment link, and set the send
          frequency — all on the next page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-zinc-400">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
          <p>
            Automated reminders are a{" "}
            <span className="font-medium text-zinc-300">backup escalation</span>{" "}
            — use them when manual follow-ups haven&apos;t worked. They email
            the customer on a schedule until you mark them as paid or stop the
            sequence.
          </p>
        </div>
      </div>

      <Section title="Current status">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-zinc-200">
              {isActive ? "Sending reminders" : "Reminders paused"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              Every {customer.reminder_frequency_days} day
              {customer.reminder_frequency_days === 1 ? "" : "s"}
            </p>
          </div>

          {isActive ? (
            <form action={pauseReminder.bind(null, customer.id)}>
              <Button variant="secondary" size="sm" type="submit">
                Pause
              </Button>
            </form>
          ) : (
            <form action={resumeReminder.bind(null, customer.id)}>
              <Button variant="primary" size="sm" type="submit">
                Resume
              </Button>
            </form>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-white/5 bg-black/20 p-3 text-xs text-zinc-400">
          <div className="flex justify-between">
            <span className="text-zinc-500">Next send:</span>
            <span className="text-zinc-300">
              {isActive ? new Date(customer.next_send_at).toLocaleString() : "Paused"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Last sent:</span>
            <span className={customer.last_sent_at ? "text-zinc-300" : "text-zinc-500"}>
              {customer.last_sent_at ? new Date(customer.last_sent_at).toLocaleString() : "Never"}
            </span>
          </div>
        </div>
      </Section>

      <a
        href={`/reminders/new?customer_id=${customer.id}`}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
      >
        <Zap className="h-3 w-3" />
        Edit automation settings
      </a>

      {isDevelopment && (
        <p className="text-xs text-zinc-600">
          Dev: use the test button on the dashboard card.
        </p>
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Timeline tab
// ---------------------------------------------------------------------------
function TimelineTab({ customer }: { customer: CustomerRecord }) {
  type ActivityItem = {
    id: string;
    label: string;
    sub?: string;
    at: string;
    tone: "success" | "warning" | "muted" | "primary" | "default";
    icon?: React.ElementType;
  };

  const entries: ActivityItem[] = [];

  // 1. Paid events
  if (customer.client_paid_at) {
    entries.push({
      id: `${customer.id}-paid-client`,
      label: "Marked paid by customer",
      at: customer.client_paid_at,
      tone: "success",
      icon: CheckCircle2,
    });
  } else if (customer.workflow_status === "paid") {
    entries.push({
      id: `${customer.id}-paid-you`,
      label: "Marked paid by you",
      at: customer.updated_at,
      tone: "success",
      icon: CheckCircle2,
    });
  }

  // 2. Promise events
  if (customer.promised_date) {
    entries.push({
      id: `${customer.id}-promised`,
      label: "Payment promised",
      sub: `Promised by ${new Date(customer.promised_date).toLocaleDateString()}${customer.promise_notes ? ` - ${customer.promise_notes}` : ''}`,
      at: customer.updated_at,
      tone: "primary",
      icon: Clock,
    });
  }

  // 3. Reminders sent
  if (customer.last_sent_at) {
    entries.push({
      id: `${customer.id}-sent`,
      label: "Automated reminder sent",
      at: customer.last_sent_at,
      tone: "muted",
      icon: Zap,
    });
  }

  // 4. Payment History (manual partial payments)
  for (const payment of customer.payment_history ?? []) {
    entries.push({
      id: `${payment.id}-payment`,
      label: "Payment logged",
      sub: formatCurrency(Number(payment.amount), payment.currency),
      at: payment.created_at,
      tone: "success",
      icon: ReceiptText,
    });
  }

  // 5. Followup History
  for (const followup of customer.followup_history ?? []) {
    entries.push({
      id: `${followup.id}-followup`,
      label: `Follow-up: ${followup.method}`,
      sub: `Outcome: ${followup.outcome}${followup.note ? ` - ${followup.note}` : ''}`,
      at: followup.created_at,
      tone: "default",
      icon: MessageSquare,
    });
  }

  // 6. Creation date
  entries.push({
    id: `${customer.id}-created`,
    label: "Customer added",
    at: customer.created_at,
    tone: "muted",
  });

  const sorted = entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const dotColors = {
    success: "bg-emerald-400 text-emerald-400 border-emerald-400/20",
    warning: "bg-red-400 text-red-400 border-red-400/20",
    primary: "bg-indigo-400 text-indigo-400 border-indigo-400/20",
    default: "bg-blue-400 text-blue-400 border-blue-400/20",
    muted: "bg-zinc-500 text-zinc-500 border-zinc-500/20",
  };

  return (
    <div className="space-y-4">
      <Section title="Activity Timeline">
        <div className="relative border-l border-white/10 ml-3 pl-6 space-y-6 py-2">
          {sorted.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative">
                <div className={cn("absolute -left-[30px] top-1 h-3 w-3 rounded-full border-2 bg-background", dotColors[item.tone])} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                    {Icon && <Icon className={cn("h-3.5 w-3.5", dotColors[item.tone].split(" ")[1])} />}
                  </div>
                  {item.sub && <p className="mt-0.5 text-sm text-zinc-400">{item.sub}</p>}
                  <p className="mt-1 text-xs text-zinc-600">
                    {new Date(item.at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main drawer component
// ---------------------------------------------------------------------------
export function CustomerDetails({
  customer,
  initialTab = "timeline",
  isDevelopment,
}: {
  customer: CustomerRecord | null;
  initialTab?: Tab;
  isDevelopment: boolean;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  if (!customer) return null;

  const daysOverdue = getDaysOverdue(customer);
  const remaining = getRemainingBalance(customer);

  return (
    <div className="flex flex-col mx-auto max-w-4xl pt-8 pb-16 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
                {customer.recipient_name}
              </h2>
              {remaining <= 0 && (
                <Badge variant={customer.client_paid_at ? "success" : "default"}>
                  {customer.client_paid_at ? "Customer marked paid" : "You marked paid"}
                </Badge>
              )}
              {daysOverdue && (
                <Badge variant="danger">
                  {daysOverdue}d overdue
                </Badge>
              )}
            </div>
            <form action={updateCustomerEmail} className="mt-1.5 flex items-center gap-2 max-w-[280px]">
              <input type="hidden" name="customer_id" value={customer.id} />
              <Input
                name="recipient_email"
                type="email"
                defaultValue={customer.recipient_email || ""}
                placeholder="Add email address..."
                required
                className="h-7 text-xs bg-transparent border-white/10 hover:border-white/20 px-2 flex-1 min-w-0"
              />
              <Button type="submit" variant="secondary" size="sm" className="h-7 px-2.5 text-xs shrink-0">
                Save
              </Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-zinc-600">Total due </span>
                <span className="font-semibold text-zinc-100">
                  {formatCurrency(Number(customer.amount_owed), customer.currency)}
                </span>
              </div>
              {remaining !== Number(customer.amount_owed) && (
                <div>
                  <span className="text-zinc-600">Remaining </span>
                  <span className="font-semibold text-zinc-100">
                    {formatCurrency(remaining, customer.currency)}
                  </span>
                </div>
              )}
              {customer.due_date && (
                <div>
                  <span className="text-zinc-600">Due </span>
                  <span
                    className={cn(
                      "font-semibold",
                      daysOverdue ? "text-red-300" : "text-zinc-100",
                    )}
                  >
                    {new Date(customer.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 border-b border-border pb-4 mb-6">
          <TabButton
            active={tab === "timeline"}
            onClick={() => setTab("timeline")}
            icon={History}
            label="Timeline"
          />
          <TabButton
            active={tab === "payment"}
            onClick={() => setTab("payment")}
            icon={CheckCircle2}
            label="Payment"
          />
          <TabButton
            active={tab === "promise"}
            onClick={() => setTab("promise")}
            icon={Clock}
            label="Promise"
          />
          <TabButton
            active={tab === "followup"}
            onClick={() => setTab("followup")}
            icon={MessageSquare}
            label="Follow-up"
          />
          <TabButton
            active={tab === "notes"}
            onClick={() => setTab("notes")}
            icon={FileText}
            label="Notes"
          />
          <TabButton
            active={tab === "automation"}
            onClick={() => setTab("automation")}
            icon={Zap}
            label="Automate"
          />
        </div>

        {/* Tab content */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            {tab === "timeline" && <TimelineTab customer={customer} />}
            {tab === "payment" && <PaymentTab customer={customer} />}
            {tab === "promise" && <PromiseTab customer={customer} />}
            {tab === "followup" && <FollowUpTab customer={customer} />}
            {tab === "notes" && <NotesTab customer={customer} />}
            {tab === "automation" && (
              <AutomationTab customer={customer} isDevelopment={isDevelopment} />
            )}
          </div>

          {/* Danger zone — Sidebar / Bottom */}
          <div className="lg:w-64 shrink-0 space-y-4">
            <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4">
              <h3 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Permanently remove this customer and all their associated data.
              </p>
              <form action={deleteCustomer}>
                <input type="hidden" name="customer_id" value={customer.id} />
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  className="w-full gap-2"
                  onClick={(e) => {
                    if (!window.confirm(`Delete ${customer.recipient_name}? This cannot be undone.`)) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete customer
                </Button>
              </form>
            </div>
          </div>
        </div>
    </div>
  );
}
