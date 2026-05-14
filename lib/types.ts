// Workflow pipeline status values
export type WorkflowStatus =
  | "outstanding"
  | "promised"
  | "partial"
  | "paid"
  | "overdue"
  | "written_off";

// Relationship tag for customer segmentation
export type RelationshipTag = "new_client" | "returning" | "at_risk" | "vip";

// Tone options for follow-up message drafting
export type FollowUpTone = "friendly" | "professional" | "firm";

// Core database row type — extended with workflow-first columns
export type ReminderRow = {
  id: string;
  user_id: string;

  // Customer info
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
  relationship_tag: RelationshipTag | null;

  // Promise tracking
  promised_date: string | null;
  promise_notes: string | null;

  // Notes & communication
  custom_message: string | null;
  internal_notes: string | null;
  payment_link: string | null;

  // Automation (supporting feature)
  reminder_frequency_days: number;
  next_send_at: string;
  last_sent_at: string | null;
  active: boolean;
  unsubscribed: boolean;
  unsubscribe_token: string;

  created_at: string;
  updated_at: string;
};

// Semantic alias — the UI uses this name when thinking customer-first
export type CustomerRecord = ReminderRow;

// Derived helpers
export function getRemainingBalance(customer: CustomerRecord): number {
  return Math.max(0, Number(customer.amount_owed) - Number(customer.amount_paid));
}

export function getDaysOverdue(customer: CustomerRecord): number | null {
  if (!customer.due_date) return null;
  const due = new Date(customer.due_date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

export function isEffectivelyPaid(customer: CustomerRecord): boolean {
  return customer.workflow_status === "paid" || customer.client_paid_at !== null;
}

