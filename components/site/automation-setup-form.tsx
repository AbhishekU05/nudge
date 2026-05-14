"use client";

/*
 * AutomationSetupForm — client component rendered on /reminders/new.
 * Handles the interactive tone picker, live email preview, and the
 * form that calls the enableAutomation server action.
 */

import { useState } from "react";
import { Zap, Link2, Clock, Leaf, FileText, AlertOctagon } from "lucide-react";

import { enableAutomation } from "@/app/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tone = "polite" | "neutral" | "firm";

export type AutomationSetupFormProps = {
  customer: {
    id: string;
    recipient_name: string;
    recipient_email: string;
    amount_owed: number;
    currency: string;
  };
  senderName: string;
  error?: string;
};

// ---------------------------------------------------------------------------
// Tone template notes (pre-fill for the custom_message field)
// ---------------------------------------------------------------------------

const TONE_TEMPLATES: Record<Tone, string> = {
  polite:
    "Just a friendly follow-up about your outstanding balance. I completely understand if things are busy — whenever is convenient for you is perfectly fine. Feel free to reach out if you have any questions at all.",
  neutral:
    "This is a reminder about your outstanding balance. Please let me know if you have any questions or need any clarification. Happy to help.",
  firm: "This is a formal notice that your balance remains outstanding and requires your prompt attention. Please arrange payment at your earliest convenience and confirm via reply.",
};

const TONE_CONFIG: Record<
  Tone,
  {
    label: string;
    desc: string;
    icon: React.ElementType;
    activeClass: string;
    iconClass: string;
  }
> = {
  polite: {
    label: "Polite",
    desc: "Warm & understanding",
    icon: Leaf,
    activeClass: "border-emerald-500/50 bg-emerald-500/10",
    iconClass: "text-emerald-400",
  },
  neutral: {
    label: "Neutral",
    desc: "Clear & professional",
    icon: FileText,
    activeClass: "border-primary/50 bg-primary/10",
    iconClass: "text-primary",
  },
  firm: {
    label: "Firm",
    desc: "Direct & assertive",
    icon: AlertOctagon,
    activeClass: "border-amber-500/50 bg-amber-500/10",
    iconClass: "text-amber-400",
  },
};

// ---------------------------------------------------------------------------
// Email preview
// ---------------------------------------------------------------------------

function EmailPreview({
  recipientName,
  senderName,
  amount,
  note,
  paymentLink,
}: {
  recipientName: string;
  senderName: string;
  amount: string;
  note: string;
  paymentLink: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#f8f8fc] text-[#1a1a1a] shadow-xl shadow-black/30">
      {/* Email chrome */}
      <div className="border-b border-black/[0.06] bg-white/80 px-5 py-3">
        <p className="text-xs font-medium text-[#888]">Subject</p>
        <p className="mt-0.5 text-sm font-semibold text-[#111]">
          Payment reminder
        </p>
      </div>

      {/* Body */}
      <div className="px-5 py-5 text-sm leading-6">
        <p className="text-[#555]">Hi {recipientName || "there"},</p>
        <p className="mt-3 text-[#333]">
          This is a reminder that your balance to{" "}
          <strong>{senderName}</strong> is currently outstanding.
        </p>

        {/* Amount box */}
        <div className="my-4 rounded-xl border border-[#e4e4f0] bg-[#f0f0f8] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#888]">
            Pending balance
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#111]">
            {amount}
          </p>
        </div>

        {/* Note */}
        {note && (
          <div className="my-4 border-l-2 border-indigo-400 pl-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#888]">
              Note from {senderName}
            </p>
            <p className="mt-1 text-sm text-[#444]">{note}</p>
          </div>
        )}

        <p className="text-xs text-[#aaa]">
          If you&apos;ve already paid, please ignore this message.
        </p>

        {/* Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {paymentLink && (
            <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">
              <Link2 className="h-3 w-3" />
              Pay now
            </div>
          )}
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#ddd] bg-white px-3 py-2 text-xs font-semibold text-[#333]">
            I&apos;ve paid
          </div>
        </div>

        <p className="mt-5 text-[11px] text-[#ccc]">
          This reminder was sent by Duely on behalf of {senderName}.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AutomationSetupForm({
  customer,
  senderName,
  error,
}: AutomationSetupFormProps) {
  const [tone, setTone] = useState<Tone>("neutral");
  const [note, setNote] = useState(TONE_TEMPLATES.neutral);
  const [paymentLink, setPaymentLink] = useState("");

  function handleToneSelect(t: Tone) {
    setTone(t);
    setNote(TONE_TEMPLATES[t]);
  }

  const amount = new Intl.NumberFormat(undefined, {
    currency: customer.currency,
    style: "currency",
  }).format(Number(customer.amount_owed));

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
      {/* ── Form column ─────────────────────────────────────── */}
      <form action={enableAutomation} className="space-y-7">
        <input type="hidden" name="customer_id" value={customer.id} />

        {/* Tone picker */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
            Email tone
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(["polite", "neutral", "firm"] as Tone[]).map((t) => {
              const cfg = TONE_CONFIG[t];
              const Icon = cfg.icon;
              const active = tone === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleToneSelect(t)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all",
                    active
                      ? cfg.activeClass
                      : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active ? cfg.iconClass : "text-zinc-500",
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        active ? "text-zinc-100" : "text-zinc-400",
                      )}
                    >
                      {cfg.label}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-none text-zinc-600">
                      {cfg.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Note (editable, pre-filled from tone) */}
        <div className="space-y-2">
          <Label htmlFor="custom_message">
            Note in email{" "}
            <span className="text-zinc-600">(optional — edit freely)</span>
          </Label>
          <Textarea
            id="custom_message"
            name="custom_message"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="A short note shown inside the reminder email."
          />
          <p className="text-xs text-zinc-600">
            Shown as a &ldquo;Note from you&rdquo; block inside the email.{" "}
            {500 - note.length} chars remaining.
          </p>
        </div>

        {/* Payment link */}
        <div className="space-y-2">
          <Label htmlFor="payment_link" className="flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 text-zinc-500" />
            Payment link{" "}
            <span className="text-zinc-600">(optional)</span>
          </Label>
          <Input
            id="payment_link"
            name="payment_link"
            type="url"
            placeholder="https://checkout.example.com/invoice/123"
            maxLength={2048}
            value={paymentLink}
            onChange={(e) => setPaymentLink(e.target.value)}
          />
          <p className="text-xs text-zinc-600">
            Adds a &ldquo;Pay now&rdquo; button to the email.
          </p>
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <Label
            htmlFor="reminder_frequency_days"
            className="flex items-center gap-1.5"
          >
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            Send every
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="reminder_frequency_days"
              name="reminder_frequency_days"
              type="number"
              min={1}
              defaultValue={7}
              className="w-24"
            />
            <span className="text-sm text-zinc-500">days</span>
          </div>
          <p className="text-xs text-zinc-600">
            First email sends in ~5 minutes. Subsequent emails follow this
            interval.
          </p>
        </div>

        {/* Error */}
        {error && (
          <p
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" className="gap-2">
            <Zap className="h-3.5 w-3.5" />
            Enable automation
          </Button>
          <p className="text-xs text-zinc-600">
            You can pause or stop anytime from the dashboard.
          </p>
        </div>
      </form>

      {/* ── Live preview column ──────────────────────────────── */}
      <aside className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
          Email preview
        </p>
        <EmailPreview
          recipientName={customer.recipient_name}
          senderName={senderName}
          amount={amount}
          note={note}
          paymentLink={paymentLink}
        />
      </aside>
    </div>
  );
}
