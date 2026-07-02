import { createClient } from "../app/actions/clients";
import { promiseToPayAction } from "../app/actions/portal";
import { createLateFeePolicy, deleteLateFeePolicy, updateLateFeePolicy, toggleLateFeePolicyActive } from "../app/actions/late-fees";
import { createCustomer, recordPartialPayment, deleteCustomer, saveInternalNotes } from "../app/actions/customers";
import { mockStore } from "./mocks/store";
import { describe, it, expect } from "./framework";

describe("Feature 2: Customer & Pipeline", () => {
  // --- HAPPY PATHS ---

  it("H1: should successfully create a client if subscriber is active", async () => {
    mockStore.currentUser = { id: "user-123", email: "subscriber@example.com" };
    mockStore.database.profiles.push({
      user_id: "user-123",
      razorpay_subscription_status: "active",
    });

    const formData = new FormData();
    formData.append("name", "Acme Corp");
    formData.append("email", "billing@acme.com");

    await expect(createClient(formData)).toThrowAsync("/customers/");
    expect(mockStore.database.clients.length).toBe(1);
    expect(mockStore.database.clients[0].name).toBe("Acme Corp");
  });

  it("H2: should successfully register promise to pay on client portal", async () => {
    mockStore.database.invoices.push({
      id: "inv-999",
      amount_due: 100,
      client_id: "client-123",
    });

    const formData = new FormData();
    formData.append("invoice_id", "inv-999");
    formData.append("promised_date", "2026-08-01");

    await expect(promiseToPayAction(formData)).toThrowAsync("/portal/status?success=true");
    expect(mockStore.database.customer_events.length).toBe(1);
    expect(mockStore.database.customer_events[0].event_type).toBe("promise_to_pay");
  });

  it("H3: should successfully create a late fee policy", async () => {
    mockStore.currentUser = { id: "user-123" };
    const formData = new FormData();
    formData.append("name", "Standard Late Fee");
    formData.append("rate", "1.5");
    formData.append("grace_period_days", "5");
    formData.append("frequency", "monthly");

    await expect(createLateFeePolicy(formData)).toThrowAsync("/settings/billing");
    expect(mockStore.database.late_fee_policies.length).toBe(1);
    expect(mockStore.database.late_fee_policies[0].name).toBe("Standard Late Fee");
  });

  it("H4: should successfully create a new customer invoice", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.profiles.push({
      user_id: "user-123",
      razorpay_subscription_status: "active",
    });
    mockStore.database.clients.push({ id: "client-123", user_id: "user-123", name: "Acme" });

    const formData = new FormData();
    formData.append("client_id", "client-123");
    formData.append("invoice_number", "INV-2026-001");
    formData.append("amount_due", "1500.00");
    formData.append("due_date", "2026-07-31");

    await expect(createCustomer(formData)).toThrowAsync("/customers/client-123");
    expect(mockStore.database.invoices.length).toBe(1);
    expect(mockStore.database.invoices[0].amount_due).toBe(1500.00);
  });

  it("H5: should successfully record partial payment and log event", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.invoices.push({
      id: "inv-555",
      user_id: "user-123",
      amount_due: 1000,
      client_id: "client-123",
    });

    const formData = new FormData();
    formData.append("invoice_id", "inv-555");
    formData.append("amount_paid", "400.00");
    formData.append("payment_date", "2026-07-02");
    formData.append("notes", "Check #101");

    await expect(recordPartialPayment(formData)).toThrowAsync("/customers/client-123");
    expect(mockStore.database.invoices[0].amount_due).toBe(600); // 1000 - 400
    expect(mockStore.database.customer_events.length).toBe(1);
  });

  it("H6: should successfully update/save internal customer notes", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.invoices.push({
      id: "inv-777",
      user_id: "user-123",
      client_id: "client-123",
      notes: "Initial note",
    });

    const formData = new FormData();
    formData.append("invoice_id", "inv-777");
    formData.append("notes", "Updated internal notes");

    await expect(saveInternalNotes(formData)).toThrowAsync("/customers/client-123");
    expect(mockStore.database.invoices[0].notes).toBe("Updated internal notes");
  });

  // --- BOUNDARY AND ERROR PATHS ---

  it("E1: createClient should fail if user has no active subscription", async () => {
    mockStore.currentUser = { id: "user-123", email: "non-sub@example.com" };
    mockStore.database.profiles.push({
      user_id: "user-123",
      razorpay_subscription_status: "none",
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago (trial expired)
    });

    const formData = new FormData();
    formData.append("name", "Acme Corp");

    await expect(createClient(formData)).toThrowAsync("/settings/billing");
  });

  it("E2: createClient should fail if name is missing", async () => {
    mockStore.currentUser = { id: "user-123", email: "subscriber@example.com" };
    mockStore.database.profiles.push({ user_id: "user-123", razorpay_subscription_status: "active" });

    const formData = new FormData();
    formData.append("name", "");

    await expect(createClient(formData)).toThrowAsync("/customers/new?error=");
  });

  it("E3: createLateFeePolicy should fail if rate is negative", async () => {
    mockStore.currentUser = { id: "user-123" };
    const formData = new FormData();
    formData.append("name", "Bad Fee");
    formData.append("rate", "-1.5");

    await expect(createLateFeePolicy(formData)).toThrowAsync("rate");
  });

  it("E4: createCustomer should fail if amount_due is zero or negative", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.profiles.push({ user_id: "user-123", razorpay_subscription_status: "active" });
    const formData = new FormData();
    formData.append("client_id", "client-123");
    formData.append("invoice_number", "INV-2");
    formData.append("amount_due", "-10");

    await expect(createCustomer(formData)).toThrowAsync("Amount+due+must+be+greater+than+0");
  });

  it("E5: deleteCustomer should redirect to customer page with error if not found", async () => {
    mockStore.currentUser = { id: "user-123" };
    const formData = new FormData();
    formData.append("invoice_id", "inv-non-existent");

    await expect(deleteCustomer(formData)).toThrowAsync("Customer+not+found");
  });
});
