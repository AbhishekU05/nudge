import { CustomerRecord, CustomerEvent } from "./types";

export const mockCustomers: any[] = [
  {
    id: "1",
    user_id: "user-1",
    recipient_name: "Acme Corp",
    amount_owed: 12400,
    amount_paid: 0,
    currency: "USD",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    due_date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(), // 32 days overdue
    active: true,
  },
  {
    id: "2",
    user_id: "user-1",
    recipient_name: "Globex",
    amount_owed: 8200,
    amount_paid: 0,
    currency: "USD",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days overdue
    active: true,
  },
  {
    id: "3",
    user_id: "user-1",
    recipient_name: "Initech",
    amount_owed: 4100,
    amount_paid: 0,
    currency: "USD",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days overdue
    active: true,
  },
  {
    id: "4",
    user_id: "user-1",
    recipient_name: "Stark Industries",
    amount_owed: 184200,
    amount_paid: 184200,
    currency: "USD",
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    due_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    client_paid_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
  },
  {
    id: "5",
    user_id: "user-1",
    recipient_name: "Wayne Enterprises",
    amount_owed: 17800,
    amount_paid: 0,
    currency: "USD",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // Due in 10 days
    active: true,
  }
];

export const mockEvents: any[] = [
  {
    id: "1",
    customer_id: "4",
    user_id: "user-1",
    event_type: "payment",
    amount: 184200,
    currency: "USD",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  ...Array.from({ length: 42 }).map((_, i) => ({
    id: `f-${i}`,
    customer_id: "4",
    user_id: "user-1",
    event_type: "followup" as any,
    created_at: new Date(Date.now() - (10 + Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString(),
    followup_method: "email",
  }))
];

export const mockUser = {
  email: "demo@duely.in",
  displayName: "Demo User",
  initials: "DU",
};
