"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const automation_1 = require("../app/actions/automation");
const reminders_1 = require("../app/actions/reminders");
const drafts_1 = require("../app/actions/drafts");
const store_1 = require("./mocks/store");
const framework_1 = require("./framework");
(0, framework_1.describe)("Feature 3: Automation & Reminders", () => {
    // --- HAPPY PATHS ---
    (0, framework_1.it)("H1: should successfully save automation settings", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        const formData = new FormData();
        formData.append("reply_to_email", "reply@nudge.com");
        formData.append("cc_emails", "cc1@nudge.com,cc2@nudge.com");
        formData.append("collect_late_fees", "true");
        formData.append("reminder_schedule", JSON.stringify([1, 3, 7]));
        await (0, framework_1.expect)((0, automation_1.saveAutomationSettings)(formData)).toThrowAsync("/settings/automation");
        (0, framework_1.expect)(store_1.mockStore.database.profiles.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.profiles[0].reply_to_email).toBe("reply@nudge.com");
    });
    (0, framework_1.it)("H2: should successfully pause automation for a client", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.clients.push({ id: "client-123", user_id: "user-123", automation_paused: false });
        await (0, framework_1.expect)((0, automation_1.pauseAutomation)("client", "client-123")).toThrowAsync("/customers/client-123");
        (0, framework_1.expect)(store_1.mockStore.database.clients[0].automation_paused).toBe(true);
    });
    (0, framework_1.it)("H3: should successfully create a new reminder (invoice)", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        const formData = new FormData();
        formData.append("recipient_name", "Bob");
        formData.append("recipient_email", "bob@example.com");
        formData.append("amount_owed", "250.00");
        formData.append("reminder_frequency_days", "3");
        formData.append("currency", "USD");
        formData.append("custom_message", "Hello");
        await (0, framework_1.expect)((0, reminders_1.createReminder)(formData)).toThrowAsync("/reminders?success=Reminder+created");
        (0, framework_1.expect)(store_1.mockStore.database.invoices.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.invoices[0].recipient_email).toBe("bob@example.com");
    });
    (0, framework_1.it)("H4: should successfully pause and resume an active reminder", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.invoices.push({ id: "rem-111", user_id: "user-123", active: true });
        await (0, framework_1.expect)((0, reminders_1.pauseReminder)("rem-111")).toThrowAsync("/reminders?success=");
        (0, framework_1.expect)(store_1.mockStore.database.invoices[0].active).toBe(false);
        await (0, framework_1.expect)((0, reminders_1.resumeReminder)("rem-111")).toThrowAsync("/reminders?success=");
        (0, framework_1.expect)(store_1.mockStore.database.invoices[0].active).toBe(true);
    });
    (0, framework_1.it)("H5: should successfully delete a reminder", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.invoices.push({ id: "rem-222", user_id: "user-123", active: true });
        await (0, framework_1.expect)((0, reminders_1.deleteReminder)("rem-222")).toThrowAsync("/reminders?success=");
        (0, framework_1.expect)(store_1.mockStore.database.invoices.length).toBe(0);
    });
    (0, framework_1.it)("H6: should successfully update draft content and approve a draft email via Resend", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.email_drafts.push({
            id: "draft-123",
            user_id: "user-123",
            subject: "Original Subject",
            body_html: "Original Body",
            recipient_email: "draft-user@example.com",
        });
        await (0, drafts_1.updateDraftContent)("draft-123", "New Subject", "New Body");
        (0, framework_1.expect)(store_1.mockStore.database.email_drafts[0].subject).toBe("New Subject");
        await (0, drafts_1.approveDraft)("draft-123");
        (0, framework_1.expect)(store_1.mockStore.resendEmails.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.resendEmails[0].to).toBe("draft-user@example.com");
        (0, framework_1.expect)(store_1.mockStore.database.email_drafts.length).toBe(0); // deleted after sending
    });
    // --- BOUNDARY AND ERROR PATHS ---
    (0, framework_1.it)("E1: createReminder should fail if recipient email format is invalid", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        const formData = new FormData();
        formData.append("recipient_name", "Bob");
        formData.append("recipient_email", "invalidemail");
        formData.append("amount_owed", "200");
        formData.append("reminder_frequency_days", "3");
        await (0, framework_1.expect)((0, reminders_1.createReminder)(formData)).toThrowAsync("valid+recipient+email");
    });
    (0, framework_1.it)("E2: createReminder should fail if amount owed is not a valid number", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        const formData = new FormData();
        formData.append("recipient_name", "Bob");
        formData.append("recipient_email", "bob@example.com");
        formData.append("amount_owed", "abc");
        formData.append("reminder_frequency_days", "3");
        await (0, framework_1.expect)((0, reminders_1.createReminder)(formData)).toThrowAsync("valid+amount");
    });
    (0, framework_1.it)("E3: createReminder should fail if reminder frequency is negative", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        const formData = new FormData();
        formData.append("recipient_name", "Bob");
        formData.append("recipient_email", "bob@example.com");
        formData.append("amount_owed", "100");
        formData.append("reminder_frequency_days", "-1");
        await (0, framework_1.expect)((0, reminders_1.createReminder)(formData)).toThrowAsync("at+least+1+day");
    });
    (0, framework_1.it)("E4: approveDraft should fail if draft is not found", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        await (0, framework_1.expect)((0, drafts_1.approveDraft)("non-existent-draft")).toThrowAsync("Draft not found");
    });
    (0, framework_1.it)("E5: updateDraftContent should fail if draft does not exist", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        await (0, framework_1.expect)((0, drafts_1.updateDraftContent)("bad-draft", "sub", "body")).toThrowAsync("Draft not found");
    });
});
