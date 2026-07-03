"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clients_1 = require("../app/actions/clients");
const portal_1 = require("../app/actions/portal");
const late_fees_1 = require("../app/actions/late-fees");
const customers_1 = require("../app/actions/customers");
const store_1 = require("./mocks/store");
const framework_1 = require("./framework");
(0, framework_1.describe)("Feature 2: Customer & Pipeline", () => {
    // --- HAPPY PATHS ---
    (0, framework_1.it)("H1: should successfully create a client if subscriber is active", async () => {
        store_1.mockStore.currentUser = { id: "user-123", email: "subscriber@example.com" };
        store_1.mockStore.database.profiles.push({
            user_id: "user-123",
            razorpay_subscription_status: "active",
        });
        const formData = new FormData();
        formData.append("name", "Acme Corp");
        formData.append("email", "billing@acme.com");
        await (0, framework_1.expect)((0, clients_1.createClient)(formData)).toThrowAsync("/customers/");
        (0, framework_1.expect)(store_1.mockStore.database.clients.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.clients[0].name).toBe("Acme Corp");
    });
    (0, framework_1.it)("H2: should successfully register promise to pay on client portal", async () => {
        store_1.mockStore.database.invoices.push({
            id: "inv-999",
            amount_due: 100,
            client_id: "client-123",
        });
        const formData = new FormData();
        formData.append("invoice_id", "inv-999");
        formData.append("promised_date", "2026-08-01");
        await (0, framework_1.expect)((0, portal_1.promiseToPayAction)(formData)).toThrowAsync("/portal/status?success=true");
        (0, framework_1.expect)(store_1.mockStore.database.customer_events.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.customer_events[0].event_type).toBe("promise_to_pay");
    });
    (0, framework_1.it)("H3: should successfully create a late fee policy", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        const formData = new FormData();
        formData.append("name", "Standard Late Fee");
        formData.append("rate", "1.5");
        formData.append("grace_period_days", "5");
        formData.append("frequency", "monthly");
        await (0, framework_1.expect)((0, late_fees_1.createLateFeePolicy)(formData)).toThrowAsync("/settings/billing");
        (0, framework_1.expect)(store_1.mockStore.database.late_fee_policies.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.late_fee_policies[0].name).toBe("Standard Late Fee");
    });
    (0, framework_1.it)("H4: should successfully create a new customer invoice", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.profiles.push({
            user_id: "user-123",
            razorpay_subscription_status: "active",
        });
        store_1.mockStore.database.clients.push({ id: "client-123", user_id: "user-123", name: "Acme" });
        const formData = new FormData();
        formData.append("client_id", "client-123");
        formData.append("invoice_number", "INV-2026-001");
        formData.append("amount_due", "1500.00");
        formData.append("due_date", "2026-07-31");
        await (0, framework_1.expect)((0, customers_1.createCustomer)(formData)).toThrowAsync("/customers/client-123");
        (0, framework_1.expect)(store_1.mockStore.database.invoices.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.invoices[0].amount_due).toBe(1500.00);
    });
    (0, framework_1.it)("H5: should successfully record partial payment and log event", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.invoices.push({
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
        await (0, framework_1.expect)((0, customers_1.recordPartialPayment)(formData)).toThrowAsync("/customers/client-123");
        (0, framework_1.expect)(store_1.mockStore.database.invoices[0].amount_due).toBe(600); // 1000 - 400
        (0, framework_1.expect)(store_1.mockStore.database.customer_events.length).toBe(1);
    });
    (0, framework_1.it)("H6: should successfully update/save internal customer notes", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.invoices.push({
            id: "inv-777",
            user_id: "user-123",
            client_id: "client-123",
            notes: "Initial note",
        });
        const formData = new FormData();
        formData.append("invoice_id", "inv-777");
        formData.append("notes", "Updated internal notes");
        await (0, framework_1.expect)((0, customers_1.saveInternalNotes)(formData)).toThrowAsync("/customers/client-123");
        (0, framework_1.expect)(store_1.mockStore.database.invoices[0].notes).toBe("Updated internal notes");
    });
    // --- BOUNDARY AND ERROR PATHS ---
    (0, framework_1.it)("E1: createClient should fail if user has no active subscription", async () => {
        store_1.mockStore.currentUser = { id: "user-123", email: "non-sub@example.com" };
        store_1.mockStore.database.profiles.push({
            user_id: "user-123",
            razorpay_subscription_status: "none",
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago (trial expired)
        });
        const formData = new FormData();
        formData.append("name", "Acme Corp");
        await (0, framework_1.expect)((0, clients_1.createClient)(formData)).toThrowAsync("/settings/billing");
    });
    (0, framework_1.it)("E2: createClient should fail if name is missing", async () => {
        store_1.mockStore.currentUser = { id: "user-123", email: "subscriber@example.com" };
        store_1.mockStore.database.profiles.push({ user_id: "user-123", razorpay_subscription_status: "active" });
        const formData = new FormData();
        formData.append("name", "");
        await (0, framework_1.expect)((0, clients_1.createClient)(formData)).toThrowAsync("/customers/new?error=");
    });
    (0, framework_1.it)("E3: createLateFeePolicy should fail if rate is negative", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        const formData = new FormData();
        formData.append("name", "Bad Fee");
        formData.append("rate", "-1.5");
        await (0, framework_1.expect)((0, late_fees_1.createLateFeePolicy)(formData)).toThrowAsync("rate");
    });
    (0, framework_1.it)("E4: createCustomer should fail if amount_due is zero or negative", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.profiles.push({ user_id: "user-123", razorpay_subscription_status: "active" });
        const formData = new FormData();
        formData.append("client_id", "client-123");
        formData.append("invoice_number", "INV-2");
        formData.append("amount_due", "-10");
        await (0, framework_1.expect)((0, customers_1.createCustomer)(formData)).toThrowAsync("Amount+due+must+be+greater+than+0");
    });
    (0, framework_1.it)("E5: deleteCustomer should redirect to customer page with error if not found", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        const formData = new FormData();
        formData.append("invoice_id", "inv-non-existent");
        await (0, framework_1.expect)((0, customers_1.deleteCustomer)(formData)).toThrowAsync("Customer+not+found");
    });
});
