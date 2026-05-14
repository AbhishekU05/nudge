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
  ChevronDown,
  Copy,
  Check,
  Link2,
  AlertCircle,
  Undo2,
  Trash2,
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
} from "@/app/actions/customers";
import { FOLLOWUP_TEMPLATES } from "@/lib/followup-templates";
import { pauseReminder, resumeReminder } from "@/app/actions/reminders";
import { cn } from "@/lib/utils";
import type { CustomerRecord, FollowUpTone } from "@/lib/types";
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

type Tab = "payment" | "promise" | "followup" | "notes" | "automation";

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

// ---------------------------------------------------------------------------
// Relationship tag badge
// ---------------------------------------------------------------------------
function RelationshipBadge({ tag }: { tag: CustomerRecord["relationship_tag"] }) {
  if (!tag) return null;
  const labels: Record<string, string> = {
    new_client: "New client",
    returning: "Returning",
    at_risk: "At risk",
    vip: "VIP",
  };
  const variants: Record<string, "default" | "success" | "warning" | "danger" | "muted"> = {
    new_client: "default",
    returning: "success",
    at_risk: "danger",
    vip: "muted",
  };
  return (
    <Badge variant={variants[tag] ?? "muted"}>{labels[tag] ?? tag}</Badge>
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

      {isFullyPaid ? (
        <div className="space-y-3">
          {/* Fully paid badge */}
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Fully paid
              {customer.client_paid_at ? (
                <span className="ml-2 text-xs text-emerald-400/70">— customer confirmed</span>
              ) : (
                <span className="ml-2 text-xs text-emerald-400/70">— marked by you</span>
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
// Follow-up drafting tab (template-based, no AI)
// ---------------------------------------------------------------------------
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

  return (
    <div className="space-y-5">
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
// Main drawer component
// ---------------------------------------------------------------------------
export function CustomerDrawer({
  customer,
  initialTab = "payment",
  isDevelopment,
  onClose,
}: {
  customer: CustomerRecord | null;
  initialTab?: Tab;
  isDevelopment: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  if (!customer) return null;

  const daysOverdue = getDaysOverdue(customer);
  const remaining = getRemainingBalance(customer);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-label={`Customer detail: ${customer.recipient_name}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl shadow-black/50"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
                {customer.recipient_name}
              </h2>
              <RelationshipBadge tag={customer.relationship_tag} />
              {daysOverdue && (
                <Badge variant="danger">
                  {daysOverdue}d overdue
                </Badge>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm text-zinc-500">
              {customer.recipient_email}
            </p>
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
          <button
            type="button"
            onClick={onClose}
            className="ml-3 shrink-0 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border px-3 py-2">
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
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            {tab === "payment" && <PaymentTab customer={customer} />}
            {tab === "promise" && <PromiseTab customer={customer} />}
            {tab === "followup" && <FollowUpTab customer={customer} />}
            {tab === "notes" && <NotesTab customer={customer} />}
            {tab === "automation" && (
              <AutomationTab customer={customer} isDevelopment={isDevelopment} />
            )}
          </div>

          {/* Danger zone — always visible at bottom */}
          <div className="border-t border-white/[0.04] px-5 py-4">
            <form action={deleteCustomer}>
              <input type="hidden" name="customer_id" value={customer.id} />
              <button
                type="submit"
                className="flex items-center gap-2 text-xs text-zinc-700 transition-colors hover:text-red-400"
                onClick={(e) => {
                  if (!window.confirm(`Delete ${customer.recipient_name}? This cannot be undone.`)) {
                    e.preventDefault();
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete customer
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
