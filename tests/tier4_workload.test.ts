import { login, signup } from "../app/actions/auth";
import { createClient } from "../app/actions/clients";
import { saveAutomationSettings } from "../app/actions/automation";
import { createCustomer, recordPartialPayment, markFullyPaid } from "../app/actions/customers";
import { approveDraft, updateDraftContent } from "../app/actions/drafts";
import { syncXeroNow, dailyBackgroundSync } from "../app/actions/integrations";
import { mockStore, resetMockStore } from "./mocks/store";
import { describe, it, expect } from "./framework";

describe("Tier 4: Workload Scenarios", () => {
  it("W1: E2E Invoice Lifecycle workload", async () => {
    mockStore.currentUser = { id: "user-123", email: "biz@example.com" };
    mockStore.database.profiles.push({ user_id: "user-123", razorpay_subscription_status: "active" });

    // 1. Create client
    const clientForm = new FormData();
    clientForm.append("name", "John Corp");
    clientForm.append("email", "john@corp.com");
    await expect(createClient(clientForm)).toThrowAsync("/customers/");
    const clientId = mockStore.database.clients[0].id;

    // 2. Create customer invoice
    const customerForm = new FormData();
    customerForm.append("client_id", clientId);
    customerForm.append("invoice_number", "INV-2026-99");
    customerForm.append("amount_due", "2000");
    customerForm.append("due_date", "2026-07-10");
    await expect(createCustomer(customerForm)).toThrowAsync(`/customers/${clientId}`);
    const invoiceId = mockStore.database.invoices[0].id;

    // 3. Create email draft (simulate backend automation generating a draft)
    mockStore.database.email_drafts.push({
      id: "draft-xyz",
      user_id: "user-123",
      subject: "Reminder for INV-2026-99",
      body_html: "Please pay 2000",
      recipient_email: "john@corp.com",
    });

    // 4. User edits draft and approves it
    await updateDraftContent("draft-xyz", "Urgent Reminder", "Dear John, please pay 2000");
    await approveDraft("draft-xyz");
    expect(mockStore.resendEmails.length).toBe(1);
    expect(mockStore.resendEmails[0].subject).toBe("Urgent Reminder");

    // 5. Customer pays partially
    const payForm = new FormData();
    payForm.append("invoice_id", invoiceId);
    payForm.append("amount_paid", "1200");
    payForm.append("payment_date", "2026-07-02");
    await expect(recordPartialPayment(payForm)).toThrowAsync(`/customers/${clientId}`);
    expect(mockStore.database.invoices[0].amount_due).toBe(800);

    // 6. Customer pays remaining amount
    const finalPayForm = new FormData();
    finalPayForm.append("invoice_id", invoiceId);
    finalPayForm.append("payment_date", "2026-07-03");
    await expect(markFullyPaid(finalPayForm)).toThrowAsync(`/customers/${clientId}`);
    expect(mockStore.database.invoices[0].amount_due).toBe(0);
  });

  it("W2: Multi-Tenant Data Isolation workload", async () => {
    // Register User A
    const signupA = new FormData();
    signupA.append("email", "tenantA@example.com");
    signupA.append("password", "Pass12345");
    signupA.append("confirm_password", "Pass12345");
    signupA.append("full_name", "Tenant A");
    await expect(signup(signupA)).toThrowAsync("/login?success=");
    const userA = mockStore.supabaseAuthUsers[0];

    // Register User B
    const signupB = new FormData();
    signupB.append("email", "tenantB@example.com");
    signupB.append("password", "Pass12345");
    signupB.append("confirm_password", "Pass12345");
    signupB.append("full_name", "Tenant B");
    await expect(signup(signupB)).toThrowAsync("/login?success=");
    const userB = mockStore.supabaseAuthUsers[1];

    // User A logs in and creates data
    mockStore.currentUser = userA;
    mockStore.database.profiles.push({ user_id: userA.id, razorpay_subscription_status: "active" });
    const clientAForm = new FormData();
    clientAForm.append("name", "Client of A");
    await expect(createClient(clientAForm)).toThrowAsync("/customers/");
    const clientAId = mockStore.database.clients[0].id;

    // User B logs in
    mockStore.currentUser = userB;
    mockStore.database.profiles.push({ user_id: userB.id, razorpay_subscription_status: "active" });

    // User B should NOT see Client A
    const clientsOwnedByB = mockStore.database.clients.filter(c => c.user_id === userB.id);
    expect(clientsOwnedByB.length).toBe(0);

    // User B creates their own client
    const clientBForm = new FormData();
    clientBForm.append("name", "Client of B");
    await expect(createClient(clientBForm)).toThrowAsync("/customers/");
    expect(mockStore.database.clients.length).toBe(2);
    expect(mockStore.database.clients[1].user_id).toBe(userB.id);
  });

  it("W3: Daily Background Sync and Automation run workload", async () => {
    mockStore.currentUser = { id: "user-123" };
    // Setup stale integrations
    mockStore.database.integrations.push(
      { user_id: "user-123", provider: "xero", last_synced_at: "2026-06-01" },
      { user_id: "user-123", provider: "quickbooks", last_synced_at: "2026-06-01" }
    );

    mockStore.syncResults = { imported: 3, updated: 1, markedPaid: 1 };
    await dailyBackgroundSync();

    expect(mockStore.xeroSynced).toBe(true);
    expect(mockStore.quickbooksSynced).toBe(true);
  });

  it("W4: Subscription Trial Expiration workload", async () => {
    // 1. User signs up
    const signupForm = new FormData();
    signupForm.append("email", "trial@example.com");
    signupForm.append("password", "Pass12345");
    signupForm.append("confirm_password", "Pass12345");
    signupForm.append("full_name", "Trial User");
    await expect(signup(signupForm)).toThrowAsync("/login?success=");
    const user = mockStore.supabaseAuthUsers[0];

    // 2. Profile created with trial date starting 8 days ago (trial expired)
    mockStore.currentUser = user;
    mockStore.database.profiles.push({
      user_id: user.id,
      razorpay_subscription_status: "none",
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // 3. User attempts to create a client (fails and redirects to billing)
    const clientForm = new FormData();
    clientForm.append("name", "Acme Client");
    await expect(createClient(clientForm)).toThrowAsync("/settings/billing");

    // 4. User updates subscription status to active (represents webhook update)
    mockStore.database.profiles[0].razorpay_subscription_status = "active";

    // 5. User attempts to create client again (succeeds)
    await expect(createClient(clientForm)).toThrowAsync("/customers/");
    expect(mockStore.database.clients.length).toBe(1);
    expect(mockStore.database.clients[0].name).toBe("Acme Client");
  });

  it("W5: Database Error Recovery workload", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.profiles.push({ user_id: "user-123", razorpay_subscription_status: "active" });

    // 1. Simulate DB crash
    mockStore.dbErrors.clients = new Error("Connection Timeout");

    const clientForm = new FormData();
    clientForm.append("name", "Fail Corp");
    await expect(createClient(clientForm)).toThrowAsync("/customers/new?error=");

    // 2. DB recovers (clear error)
    mockStore.dbErrors.clients = null;

    // 3. Retry action succeeds
    await expect(createClient(clientForm)).toThrowAsync("/customers/");
    expect(mockStore.database.clients.length).toBe(1);
    expect(mockStore.database.clients[0].name).toBe("Fail Corp");
  });
});
