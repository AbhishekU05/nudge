"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../app/actions/auth");
const clients_1 = require("../app/actions/clients");
const automation_1 = require("../app/actions/automation");
const customers_1 = require("../app/actions/customers");
const reminders_1 = require("../app/actions/reminders");
const integrations_1 = require("../app/actions/integrations");
const leads_1 = require("../app/actions/leads");
const store_1 = require("./mocks/store");
const framework_1 = require("./framework");
(0, framework_1.describe)("Tier 3: Pairwise Feature Combinations", () => {
    (0, framework_1.it)("P1: Auth & Pipeline - user signs up, verifies profile, and creates a client", async () => {
        // 1. Sign up new user
        const signupForm = new FormData();
        signupForm.append("email", "pairwise1@test.com");
        signupForm.append("password", "Pass12345");
        signupForm.append("confirm_password", "Pass12345");
        signupForm.append("full_name", "Pairwise One");
        await (0, framework_1.expect)((0, auth_1.signup)(signupForm)).toThrowAsync("/login?success=");
        // Simulate database population of profile and authentication login
        const user = store_1.mockStore.supabaseAuthUsers[0];
        store_1.mockStore.currentUser = user;
        store_1.mockStore.database.profiles.push({
            user_id: user.id,
            razorpay_subscription_status: "active",
        });
        // 2. Create client immediately
        const clientForm = new FormData();
        clientForm.append("name", "Pairwise Client");
        clientForm.append("email", "client1@pairwise.com");
        await (0, framework_1.expect)((0, clients_1.createClient)(clientForm)).toThrowAsync("/customers/");
        (0, framework_1.expect)(store_1.mockStore.database.clients.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.clients[0].name).toBe("Pairwise Client");
    });
    (0, framework_1.it)("P2: Pipeline & Automation - creates client and configures workspace/client automation settings", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.profiles.push({ user_id: "user-123", razorpay_subscription_status: "active" });
        // 1. Create client
        const clientForm = new FormData();
        clientForm.append("name", "Auto Client");
        await (0, framework_1.expect)((0, clients_1.createClient)(clientForm)).toThrowAsync("/customers/");
        const clientId = store_1.mockStore.database.clients[0].id;
        // 2. Configure workspace automation
        const autoForm = new FormData();
        autoForm.append("reply_to_email", "billing@auto.com");
        autoForm.append("collect_late_fees", "true");
        autoForm.append("reminder_schedule", JSON.stringify([1, 5]));
        await (0, framework_1.expect)((0, automation_1.saveAutomationSettings)(autoForm)).toThrowAsync("/settings/automation");
        // 3. Pause automation on the client
        await (0, framework_1.expect)((0, automation_1.pauseAutomation)("client", clientId)).toThrowAsync(`/customers/${clientId}`);
        (0, framework_1.expect)(store_1.mockStore.database.clients[0].automation_paused).toBe(true);
    });
    (0, framework_1.it)("P3: Pipeline & Automation/Reminders - creates customer invoice and schedules custom reminders", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.profiles.push({ user_id: "user-123", razorpay_subscription_status: "active" });
        store_1.mockStore.database.clients.push({ id: "client-123", user_id: "user-123", name: "Client A" });
        // 1. Create invoice
        const customerForm = new FormData();
        customerForm.append("client_id", "client-123");
        customerForm.append("invoice_number", "INV-100");
        customerForm.append("amount_due", "500");
        customerForm.append("due_date", "2026-07-15");
        await (0, framework_1.expect)((0, customers_1.createCustomer)(customerForm)).toThrowAsync("/customers/client-123");
        // 2. Create reminder for this client
        const reminderForm = new FormData();
        reminderForm.append("recipient_name", "Bob Client A");
        reminderForm.append("recipient_email", "bob@clienta.com");
        reminderForm.append("amount_owed", "500");
        reminderForm.append("reminder_frequency_days", "5");
        await (0, framework_1.expect)((0, reminders_1.createReminder)(reminderForm)).toThrowAsync("/reminders?success=");
        (0, framework_1.expect)(store_1.mockStore.database.invoices.length).toBe(2); // 1 from createCustomer, 1 from createReminder (in this project reminders are invoices)
    });
    (0, framework_1.it)("P4: Third-party & Pipeline - connects Xero, syncs invoices, and logs payment on synced invoice", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.profiles.push({ user_id: "user-123", razorpay_subscription_status: "active" });
        // 1. Sync Xero invoices
        store_1.mockStore.syncResults = { imported: 1, updated: 0, markedPaid: 0 };
        await (0, framework_1.expect)((0, integrations_1.syncXeroNow)()).toThrowAsync("Xero+sync+complete");
        // Simulate Xero sync creating an invoice in the DB
        const syncedInvoiceId = "xero-invoice-abc";
        store_1.mockStore.database.invoices.push({
            id: syncedInvoiceId,
            user_id: "user-123",
            amount_due: 1200,
            client_id: "client-xero",
            xero_invoice_id: "xero-id-1",
        });
        // 2. Log full payment on synced invoice
        const payForm = new FormData();
        payForm.append("invoice_id", syncedInvoiceId);
        payForm.append("payment_date", "2026-07-02");
        payForm.append("notes", "Paid via Bank Transfer");
        await (0, framework_1.expect)((0, customers_1.markFullyPaid)(payForm)).toThrowAsync("/customers/client-xero");
        (0, framework_1.expect)(store_1.mockStore.database.invoices[0].amount_due).toBe(0);
        (0, framework_1.expect)(store_1.mockStore.database.customer_events.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.customer_events[0].event_type).toBe("payment_fully_paid");
    });
    (0, framework_1.it)("P5: Marketing & Auth - guest grabs lifetime spot, then signs up with same email", async () => {
        const email = "lifetime-user@example.com";
        // 1. Capture lifetime lead
        const leadRes = await (0, leads_1.captureLifetimeDealLead)(email);
        (0, framework_1.expect)(leadRes.success).toBe(true);
        // Mock referral cookie
        store_1.mockStore.cookies.set("nudge_referral", { value: "lifetime_deal" });
        // 2. User signs up
        const signupForm = new FormData();
        signupForm.append("email", email);
        signupForm.append("password", "Pass123456");
        signupForm.append("confirm_password", "Pass123456");
        signupForm.append("full_name", "Lifetime Winner");
        await (0, framework_1.expect)((0, auth_1.signup)(signupForm)).toThrowAsync("/login?success=");
        const createdUser = store_1.mockStore.supabaseAuthUsers[0];
        (0, framework_1.expect)(createdUser.email).toBe(email);
        (0, framework_1.expect)(createdUser.user_metadata.referral_source).toBe("lifetime_deal");
    });
});
