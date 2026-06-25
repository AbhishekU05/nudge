import { CustomerRecord, CustomerEvent, ClientRecord, InvoiceRecord } from "./types";

export const mockClients: any[] = [
  { id: "c1", user_id: "user-1", name: "Acme Corp", email: "billing@acmecorp.com", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), reminder_type: "sequence", reminder_frequency_days: 7, next_send_at: new Date().toISOString(), auto_approve: true, sequence_index: 0 },
  { id: "c2", user_id: "user-1", name: "Globex", email: "ap@globex.com", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), reminder_type: "sequence", reminder_frequency_days: 14, next_send_at: new Date().toISOString(), auto_approve: false, sequence_index: 0 },
  { id: "c3", user_id: "user-1", name: "Initech", email: "finance@initech.com", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), reminder_type: "sequence", reminder_frequency_days: 30, next_send_at: new Date().toISOString(), auto_approve: true, sequence_index: 0 },
  { id: "c4", user_id: "user-1", name: "Stark Industries", email: "tony@stark.com", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), reminder_type: "sequence", reminder_frequency_days: 7, next_send_at: new Date().toISOString(), auto_approve: true, sequence_index: 0 },
  { id: "c5", user_id: "user-1", name: "Wayne Enterprises", email: "bruce@wayne.com", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), reminder_type: "sequence", reminder_frequency_days: 7, next_send_at: new Date().toISOString(), auto_approve: true, sequence_index: 0 },
  { id: "c6", user_id: "user-1", name: "Umbrella Corp", email: "billing@umbrellacorp.com", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), reminder_type: "sequence", reminder_frequency_days: 7, next_send_at: new Date().toISOString(), auto_approve: false, sequence_index: 0 },
];

export const mockInvoices: any[] = [
  // Acme Corp
  { id: "i1", client_id: "c1", user_id: "user-1", recipient_name: "Acme Corp", invoice_number: "INV-1001", amount_owed: 12400, amount_paid: 0, currency: "USD", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), due_date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(), active: true, workflow_status: "overdue", followup_history: [] },
  { id: "i2", client_id: "c1", user_id: "user-1", recipient_name: "Acme Corp", invoice_number: "INV-1002", amount_owed: 5000, amount_paid: 5000, currency: "USD", created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString(), due_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), active: true, workflow_status: "paid", followup_history: [] },
  
  // Globex
  { id: "i3", client_id: "c2", user_id: "user-1", recipient_name: "Globex", invoice_number: "INV-1003", amount_owed: 8200, amount_paid: 0, currency: "USD", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), active: true, workflow_status: "overdue", followup_history: [] },
  
  // Initech
  { id: "i4", client_id: "c3", user_id: "user-1", recipient_name: "Initech", invoice_number: "INV-1004", amount_owed: 4100, amount_paid: 0, currency: "USD", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), active: true, workflow_status: "overdue", followup_history: [] },
  { id: "i5", client_id: "c3", user_id: "user-1", recipient_name: "Initech", invoice_number: "INV-1005", amount_owed: 1200, amount_paid: 0, currency: "USD", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), active: true, workflow_status: "outstanding", followup_history: [] },
  
  // Stark Industries
  { id: "i6", client_id: "c4", user_id: "user-1", recipient_name: "Stark Industries", invoice_number: "INV-1006", amount_owed: 184200, amount_paid: 184200, currency: "USD", created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString(), due_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), active: true, workflow_status: "paid", followup_history: [] },
  
  // Wayne Enterprises
  { id: "i7", client_id: "c5", user_id: "user-1", recipient_name: "Wayne Enterprises", invoice_number: "INV-1007", amount_owed: 17800, amount_paid: 0, currency: "USD", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), active: true, workflow_status: "outstanding", followup_history: [] },

  // Umbrella Corp
  { id: "i8", client_id: "c6", user_id: "user-1", recipient_name: "Umbrella Corp", invoice_number: "INV-1008", amount_owed: 95000, amount_paid: 0, currency: "USD", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), due_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), active: true, workflow_status: "overdue", followup_history: [] },
];

export const mockCustomers = mockInvoices as any as CustomerRecord[];

export const mockEvents: any[] = [
  {
    id: "e1",
    customer_id: "i6",
    invoice_id: "i6",
    user_id: "user-1",
    event_type: "payment",
    amount: 184200,
    currency: "USD",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    event_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "e2",
    customer_id: "i2",
    invoice_id: "i2",
    user_id: "user-1",
    event_type: "payment",
    amount: 5000,
    currency: "USD",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    event_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Add some followups to Acme Corp to trigger an Action Task
  {
    id: "e3",
    customer_id: "i1",
    invoice_id: "i1",
    user_id: "user-1",
    event_type: "followup",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    event_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    followup_method: "email",
  },
  {
    id: "e4",
    customer_id: "i8",
    invoice_id: "i8",
    user_id: "user-1",
    event_type: "followup",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    event_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    followup_method: "email",
  }
];

export const mockUser = {
  email: "demo@duely.in",
  displayName: "Demo User",
  initials: "DU",
};
