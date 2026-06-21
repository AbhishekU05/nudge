// Workflow pipeline status values
export type WorkflowStatus =
  | "outstanding"
  | "promised"
  | "partial"
  | "paid"
  | "overdue"
  | "written_off";

// Tone options for follow-up message drafting
export type FollowUpTone = "friendly" | "professional" | "firm";

export type FollowUpMethod = "email" | "call" | "whatsapp" | "other";

export type FollowUpOutcome =
  | "no_response"
  | "promise_made"
  | "partial_payment"
  | "paid_in_full";

export type FollowUpLog = {
  id: string;
  customer_id: string;
  user_id: string;
  followup_date: string;
  method: FollowUpMethod;
  note: string | null;
  outcome: FollowUpOutcome;
  created_at: string;
};

export type PaymentLogSource = "user" | "customer" | "adjustment";

export type PaymentLog = {
  id: string;
  customer_id: string;
  user_id: string;
  amount: number;
  currency: string;
  source: PaymentLogSource;
  created_at: string;
};

export type CustomerEventType = "payment" | "followup";

export type CustomerEvent = {
  id: string;
  customer_id: string;
  user_id: string;
  event_type: CustomerEventType;
  event_date: string;
  amount: number | null;
  currency: string | null;
  payment_source: PaymentLogSource | null;
  followup_method: FollowUpMethod | null;
  followup_outcome: FollowUpOutcome | null;
  note: string | null;
  created_at: string;
};

// Core database row type — extended with workflow-first columns
export type ReminderRow = {
  id: string;
  user_id: string;

  // Customer info
  customer_id: string | null;
  recipient_name: string;
  recipient_email: string;

  // Payment amounts
  amount_owed: number;
  amount_paid: number;
  currency: string;

  // Dates
  due_date: string | null;       // ISO date string (YYYY-MM-DD)
  client_paid_at: string | null;

  // Workflow & pipeline
  workflow_status: WorkflowStatus;
  // Promise tracking
  promised_date: string | null;
  promise_notes: string | null;

  // Notes & communication
  custom_message: string | null;
  internal_notes: string | null;
  payment_link: string | null;
  stripe_invoice_id: string | null;
  xero_invoice_id: string | null;
  quickbooks_invoice_id: string | null;
  invoice_number: string | null;

  created_at: string;
  updated_at: string;

  payment_history: PaymentLog[];
  followup_history: FollowUpLog[];
};

export type ClientRecord = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  
  // Automation
  reminder_frequency_days: number;
  next_send_at: string | null;
  last_sent_at: string | null;
  active: boolean;
  unsubscribed: boolean;
  unsubscribe_token: string;
  auto_approve: boolean;

  created_at: string;
  updated_at: string;
};

export type EmailDraftRecord = {
  id: string;
  user_id: string;
  client_id: string;
  subject: string;
  body_html: string;
  status: "draft" | "sent" | "discarded";
  created_at: string;
  updated_at: string;
  sent_at: string | null;
};

// Semantic alias — the UI uses this name when thinking invoice-first
export type InvoiceRecord = ReminderRow;
export type CustomerRecord = ReminderRow; // Keep for backwards compatibility during transition

// Derived helpers
export function getRemainingBalance(customer: CustomerRecord): number {
  return Math.max(0, Number(customer.amount_owed) - Number(customer.amount_paid));
}

export function getDaysOverdue(customer: CustomerRecord): number | null {
  if (!customer.due_date) return null;
  // Parse as local date to avoid UTC-midnight vs local-midnight offset bug.
  // new Date("2026-05-13") creates UTC midnight; in IST (+5:30) that's 5:30am,
  // so "yesterday" appears < 24h ago and diff rounds to 0.
  const [year, month, day] = customer.due_date.split("-").map(Number);
  const due = new Date(year, month - 1, day); // local midnight
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

export function isEffectivelyPaid(customer: CustomerRecord): boolean {
  return customer.workflow_status === "paid" || customer.client_paid_at !== null;
}
