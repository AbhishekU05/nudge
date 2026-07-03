"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../app/actions/auth");
const clients_1 = require("../app/actions/clients");
const customers_1 = require("../app/actions/customers");
const drafts_1 = require("../app/actions/drafts");
const integrations_1 = require("../app/actions/integrations");
const store_1 = require("./mocks/store");
const framework_1 = require("./framework");
(0, framework_1.describe)("Tier 4: Workload Scenarios", () => {
    (0, framework_1.it)("W1: E2E Invoice Lifecycle workload", async () => {
        store_1.mockStore.currentUser = { id: "user-123", email: "biz@example.com" };
        store_1.mockStore.database.profiles.push({ user_id: "user-123", razorpay_subscription_status: "active" });
        // 1. Create client
        const clientForm = new FormData();
        clientForm.append("name", "John Corp");
        clientForm.append("email", "john@corp.com");
        await (0, framework_1.expect)((0, clients_1.createClient)(clientForm)).toThrowAsync("/customers/");
        const clientId = store_1.mockStore.database.clients[0].id;
        // 2. Create customer invoice
        const customerForm = new FormData();
        customerForm.append("client_id", clientId);
        customerForm.append("invoice_number", "INV-2026-99");
        customerForm.append("amount_due", "2000");
        customerForm.append("due_date", "2026-07-10");
        await (0, framework_1.expect)((0, customers_1.createCustomer)(customerForm)).toThrowAsync(`/customers/${clientId}`);
        const invoiceId = store_1.mockStore.database.invoices[0].id;
        // 3. Create email draft (simulate backend automation generating a draft)
        store_1.mockStore.database.email_drafts.push({
            id: "draft-xyz",
            user_id: "user-123",
            subject: "Reminder for INV-2026-99",
            body_html: "Please pay 2000",
            recipient_email: "john@corp.com",
        });
        // 4. User edits draft and approves it
        await (0, drafts_1.updateDraftContent)("draft-xyz", "Urgent Reminder", "Dear John, please pay 2000");
        await (0, drafts_1.approveDraft)("draft-xyz");
        (0, framework_1.expect)(store_1.mockStore.resendEmails.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.resendEmails[0].subject).toBe("Urgent Reminder");
        // 5. Customer pays partially
        const payForm = new FormData();
        payForm.append("invoice_id", invoiceId);
        payForm.append("amount_paid", "1200");
        payForm.append("payment_date", "2026-07-02");
        await (0, framework_1.expect)((0, customers_1.recordPartialPayment)(payForm)).toThrowAsync(`/customers/${clientId}`);
        (0, framework_1.expect)(store_1.mockStore.database.invoices[0].amount_due).toBe(800);
        // 6. Customer pays remaining amount
        const finalPayForm = new FormData();
        finalPayForm.append("invoice_id", invoiceId);
        finalPayForm.append("payment_date", "2026-07-03");
        await (0, framework_1.expect)((0, customers_1.markFullyPaid)(finalPayForm)).toThrowAsync(`/customers/${clientId}`);
        (0, framework_1.expect)(store_1.mockStore.database.invoices[0].amount_due).toBe(0);
    });
    (0, framework_1.it)("W2: Multi-Tenant Data Isolation workload", async () => {
        // Register User A
        const signupA = new FormData();
        signupA.append("email", "tenantA@example.com");
        signupA.append("password", "Pass12345");
        signupA.append("confirm_password", "Pass12345");
        signupA.append("full_name", "Tenant A");
        await (0, framework_1.expect)((0, auth_1.signup)(signupA)).toThrowAsync("/login?success=");
        const userA = store_1.mockStore.supabaseAuthUsers[0];
        // Register User B
        const signupB = new FormData();
        signupB.append("email", "tenantB@example.com");
        signupB.append("password", "Pass12345");
        signupB.append("confirm_password", "Pass12345");
        signupB.append("full_name", "Tenant B");
        await (0, framework_1.expect)((0, auth_1.signup)(signupB)).toThrowAsync("/login?success=");
        const userB = store_1.mockStore.supabaseAuthUsers[1];
        // User A logs in and creates data
        store_1.mockStore.currentUser = userA;
        store_1.mockStore.database.profiles.push({ user_id: userA.id, razorpay_subscription_status: "active" });
        const clientAForm = new FormData();
        clientAForm.append("name", "Client of A");
        await (0, framework_1.expect)((0, clients_1.createClient)(clientAForm)).toThrowAsync("/customers/");
        const clientAId = store_1.mockStore.database.clients[0].id;
        // User B logs in
        store_1.mockStore.currentUser = userB;
        store_1.mockStore.database.profiles.push({ user_id: userB.id, razorpay_subscription_status: "active" });
        // User B should NOT see Client A
        const clientsOwnedByB = store_1.mockStore.database.clients.filter(c => c.user_id === userB.id);
        (0, framework_1.expect)(clientsOwnedByB.length).toBe(0);
        // User B creates their own client
        const clientBForm = new FormData();
        clientBForm.append("name", "Client of B");
        await (0, framework_1.expect)((0, clients_1.createClient)(clientBForm)).toThrowAsync("/customers/");
        (0, framework_1.expect)(store_1.mockStore.database.clients.length).toBe(2);
        (0, framework_1.expect)(store_1.mockStore.database.clients[1].user_id).toBe(userB.id);
    });
    (0, framework_1.it)("W3: Daily Background Sync and Automation run workload", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        // Setup stale integrations
        store_1.mockStore.database.integrations.push({ user_id: "user-123", provider: "xero", last_synced_at: "2026-06-01" }, { user_id: "user-123", provider: "quickbooks", last_synced_at: "2026-06-01" });
        store_1.mockStore.syncResults = { imported: 3, updated: 1, markedPaid: 1 };
        await (0, integrations_1.dailyBackgroundSync)();
        (0, framework_1.expect)(store_1.mockStore.xeroSynced).toBe(true);
        (0, framework_1.expect)(store_1.mockStore.quickbooksSynced).toBe(true);
    });
    (0, framework_1.it)("W4: Subscription Trial Expiration workload", async () => {
        // 1. User signs up
        const signupForm = new FormData();
        signupForm.append("email", "trial@example.com");
        signupForm.append("password", "Pass12345");
        signupForm.append("confirm_password", "Pass12345");
        signupForm.append("full_name", "Trial User");
        await (0, framework_1.expect)((0, auth_1.signup)(signupForm)).toThrowAsync("/login?success=");
        const user = store_1.mockStore.supabaseAuthUsers[0];
        // 2. Profile created with trial date starting 8 days ago (trial expired)
        store_1.mockStore.currentUser = user;
        store_1.mockStore.database.profiles.push({
            user_id: user.id,
            razorpay_subscription_status: "none",
            created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        });
        // 3. User attempts to create a client (fails and redirects to billing)
        const clientForm = new FormData();
        clientForm.append("name", "Acme Client");
        await (0, framework_1.expect)((0, clients_1.createClient)(clientForm)).toThrowAsync("/settings/billing");
        // 4. User updates subscription status to active (represents webhook update)
        store_1.mockStore.database.profiles[0].razorpay_subscription_status = "active";
        // 5. User attempts to create client again (succeeds)
        await (0, framework_1.expect)((0, clients_1.createClient)(clientForm)).toThrowAsync("/customers/");
        (0, framework_1.expect)(store_1.mockStore.database.clients.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.clients[0].name).toBe("Acme Client");
    });
    (0, framework_1.it)("W5: Database Error Recovery workload", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.profiles.push({ user_id: "user-123", razorpay_subscription_status: "active" });
        // 1. Simulate DB crash
        store_1.mockStore.dbErrors.clients = new Error("Connection Timeout");
        const clientForm = new FormData();
        clientForm.append("name", "Fail Corp");
        await (0, framework_1.expect)((0, clients_1.createClient)(clientForm)).toThrowAsync("/customers/new?error=");
        // 2. DB recovers (clear error)
        store_1.mockStore.dbErrors.clients = null;
        // 3. Retry action succeeds
        await (0, framework_1.expect)((0, clients_1.createClient)(clientForm)).toThrowAsync("/customers/");
        (0, framework_1.expect)(store_1.mockStore.database.clients.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.clients[0].name).toBe("Fail Corp");
    });
});
