export type SubscriptionStatus = 'pending' | 'active' | 'on_hold' | 'paused' | 'canceled' | 'failed' | 'past_due' | 'expired';
export type OrgMemberRole = 'owner' | 'admin' | 'member';
export type InvoiceStatus = 'outstanding' | 'promised' | 'partial' | 'paid' | 'overdue' | 'written_off';
export type CrmEventType = 'followup' | 'note' | 'reminder_sent' | 'status_change' | 'late_fee_applied';
export type IntegrationProvider = 'xero' | 'quickbooks';
export type SyncDirection = 'bidirectional' | 'import_only' | 'export_only';
export type PricingPlanType = 'monthly' | 'annual' | 'base_usage';

export interface Organization {
  id: string;
  name: string;
  domain: string | null;
  dodo_customer_id: string | null;
  dodo_subscription_id: string | null;
  dodo_subscription_status: SubscriptionStatus | null;
  dodo_next_billing_date: string | null;
  plan_type: PricingPlanType | null;
  credits_balance: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: OrgMemberRole;
  created_at: string;
}

export interface Profile {
  user_id: string;
  full_name: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
  gmail_connected_email: string | null;
  timezone: string;
  weekly_digest_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  company_name: string | null;
  xero_id: string | null;
  quickbooks_id: string | null;
  created_at: string;
  updated_at: string;
  // ---------------------------------------------------------------------------
  // Legacy fields — frontend components access these without null guards.
  // Default values are applied at query time. Do not add `?` to these.
  // ---------------------------------------------------------------------------
  active: boolean;
  auto_approve: boolean;
  unsubscribed: boolean;
  unsubscribe_token: string;
  last_sent_at: string | null;
  reminder_type: "recurring" | "sequence";
  reminder_templates: { subject: string; body_html: string; days_offset?: number }[];
  sequence_index: number;
  reminder_frequency_days: number;
  next_send_at: string | null;
}

export interface Invoice {
  id: string;
  organization_id: string;
  client_id: string;
  amount: number;
  currency: string;
  due_date: string | null;
  status: InvoiceStatus;
  payment_link: string | null;
  reminders_enabled: boolean;
  reminder_frequency_days: number;
  next_send_at: string | null;
  xero_id: string | null;
  quickbooks_id: string | null;
  created_at: string;
  updated_at: string;
  // ---------------------------------------------------------------------------
  // Legacy fields — frontend components access these without null guards.
  // Default values are applied at query time. Do not add `?` to these.
  // ---------------------------------------------------------------------------
  /** @deprecated use status */
  workflow_status: InvoiceStatus;
  /** @deprecated use amount */
  amount_owed: number;
  amount_paid: number;
  invoice_number: string | null;
  reference: string | null;
  active: boolean;
  reminders_paused: boolean;
  recipient_name: string;
  recipient_email: string;
  /** @deprecated use client_id */
  customer_id: string;
  internal_notes: string | null;
  custom_message: string | null;
  promised_date: string | null;
  promise_notes: string | null;
  client_paid_at: string | null;
  unsubscribed: boolean;
  unsubscribe_token: string;
  auto_approve: boolean;
  last_sent_at: string | null;
  reminder_type: "recurring" | "sequence";
  reminder_templates: { subject: string; body_html: string; days_offset?: number }[];
  sequence_index: number;
  followup_history: FollowUpLog[];
  payment_history: PaymentLog[];
}

export interface Payment {
  id: string;
  organization_id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  reference_id: string | null;
  created_at: string;
  // ---------------------------------------------------------------------------
  // Legacy fields — the invoice detail page maps old CustomerEvent rows into
  // PaymentLog objects using these fields.
  // ---------------------------------------------------------------------------
  source?: string | null;
  payment_source?: string | null;
  customer_id?: string;
  user_id?: string;
}

export interface Event {
  id: string;
  organization_id: string;
  invoice_id: string | null;
  client_id: string | null;
  event_type: CrmEventType;
  description: string | null;
  created_at: string;
}

export interface Integration {
  organization_id: string;
  provider: IntegrationProvider;
  is_active: boolean;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  tenant_id: string;
  last_synced_at: string | null;
  sync_direction: SyncDirection;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  processed_at: string;
}

// ---------------------------------------------------------------------------
// Backward-compatibility aliases — frontend components use these names.
// Do not remove until the frontend is fully migrated to new type names.
// ---------------------------------------------------------------------------

/** @deprecated Use InvoiceStatus */
export type WorkflowStatus = InvoiceStatus;

export type FollowUpTone = "friendly" | "professional" | "firm";
export type FollowUpMethod = "email" | "call" | "whatsapp" | "other";
export type FollowUpOutcome = "no_response" | "promise_made" | "partial_payment" | "paid_in_full";
export type PaymentLogSource = "user" | "customer" | "adjustment";

/** @deprecated Use Payment */
export type PaymentLog = {
  id: string;
  invoice_id: string;
  customer_id?: string;
  user_id?: string;
  amount: number;
  currency: string;
  /** The source of this payment record. Matches PaymentSourceBadge prop exactly. */
  source: PaymentLogSource;
  payment_source?: PaymentLogSource | string | null;
  created_at: string;
};

/**
 * Legacy rich event type — used by analytics, invoices, and CRM timeline components.
 * @deprecated Migrate to Event (new schema) over time.
 */
export type CustomerEvent = {
  id: string;
  invoice_id: string;
  customer_id: string;
  user_id: string;
  event_type: "payment" | "followup" | "late_fee" | CrmEventType;
  event_date: string;
  amount: number | null;
  currency: string | null;
  payment_source: PaymentLogSource | null;
  followup_method: FollowUpMethod | null;
  followup_outcome: FollowUpOutcome | null;
  note: string | null;
  created_at: string;
};

/**
 * Legacy follow-up log — used by invoice detail and customer drawer components.
 * @deprecated Migrate to Event (new schema) over time.
 */
export type FollowUpLog = {
  id: string;
  invoice_id: string;
  customer_id: string;
  user_id: string;
  followup_date: string;
  method: FollowUpMethod;
  note: string | null;
  outcome: FollowUpOutcome;
  created_at: string;
  event_type?: CrmEventType;
};

/** @deprecated Use Client */
export type ClientRecord = Client;

/** @deprecated Use Invoice */
export type InvoiceRecord = Invoice;

/**
 * Legacy combined invoice+client view — many frontend components depend on this.
 * @deprecated Prefer querying invoices and clients separately.
 */
export type CustomerRecord = Invoice & {
  recipient_name?: string;
  recipient_email?: string;
  clients?: { name?: string; email?: string };
  amount_owed?: number;
  amount_paid?: number;
  late_fees_amount?: number;
  workflow_status?: InvoiceStatus;
  client_paid_at?: string | null;
  promised_date?: string | null;
  promise_notes?: string | null;
  custom_message?: string | null;
  internal_notes?: string | null;
  active?: boolean;
  auto_approve?: boolean;
  last_sent_at?: string | null;
  unsubscribed?: boolean;
  unsubscribe_token?: string;
  invoice_number?: string | null;
  reminder_type?: "recurring" | "sequence";
  reminder_templates?: { subject: string; body_html: string; days_offset?: number }[];
  sequence_index?: number;
  payment_history?: PaymentLog[];
  followup_history?: FollowUpLog[];
  sender_name?: string;
  sender_company?: string;
  /** @deprecated use client_id */
  customer_id?: string;
};

export type GroupRecord = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
};

export type LateFeePolicy = {
  id: string;
  organization_id: string;
  name: string;
  fee_type: "flat" | "percentage";
  fee_value: number;
  grace_period_days: number;
  frequency: "once" | "weekly" | "monthly";
  apply_to: "existing_invoice" | "new_invoice";
  included_group_ids: string[];
  active: boolean;
  auto_approve: boolean;
  created_at: string;
};

export type AppliedLateFee = {
  id: string;
  invoice_id: string;
  policy_id: string | null;
  amount: number;
  applied_at: string;
};

// ---------------------------------------------------------------------------
// Derived Helpers
// ---------------------------------------------------------------------------

export function getRemainingBalance(record: CustomerRecord): number {
  const owed = Number(record.amount_owed ?? record.amount ?? 0);
  const paid = Number(record.amount_paid ?? 0);
  return Math.max(0, owed - paid);
}

// ---------------------------------------------------------------------------
// Derived Helpers (new schema)
export function getDaysOverdue(invoice: Invoice): number | null {
  if (!invoice.due_date) return null;
  const [year, month, day] = invoice.due_date.split("-").map(Number);
  const due = new Date(year, month - 1, day); // local midnight
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

export function isEffectivelyPaid(invoice: Partial<CustomerRecord>): boolean {
  if (invoice.status === "paid" || invoice.status === "written_off") return true;
  if (invoice.workflow_status === "paid" || invoice.workflow_status === "written_off") return true;
  if (invoice.client_paid_at) return true;
  if (getRemainingBalance(invoice as CustomerRecord) <= 0 && (invoice.amount_owed ?? invoice.amount ?? 0) > 0) return true;
  return false;
}
