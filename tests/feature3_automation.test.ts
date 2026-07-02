import { saveAutomationSettings, pauseAutomation } from "../app/actions/automation";
import { createReminder, pauseReminder, resumeReminder, deleteReminder, sendTestReminderEmail } from "../app/actions/reminders";
import { approveDraft, updateDraftContent, deleteDraft } from "../app/actions/drafts";
import { mockStore } from "./mocks/store";
import { describe, it, expect } from "./framework";

describe("Feature 3: Automation & Reminders", () => {
  // --- HAPPY PATHS ---

  it("H1: should successfully save automation settings", async () => {
    mockStore.currentUser = { id: "user-123" };
    const formData = new FormData();
    formData.append("reply_to_email", "reply@nudge.com");
    formData.append("cc_emails", "cc1@nudge.com,cc2@nudge.com");
    formData.append("collect_late_fees", "true");
    formData.append("reminder_schedule", JSON.stringify([1, 3, 7]));

    await expect(saveAutomationSettings(formData)).toThrowAsync("/settings/automation");
    expect(mockStore.database.profiles.length).toBe(1);
    expect(mockStore.database.profiles[0].reply_to_email).toBe("reply@nudge.com");
  });

  it("H2: should successfully pause automation for a client", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.clients.push({ id: "client-123", user_id: "user-123", automation_paused: false });

    await expect(pauseAutomation("client", "client-123")).toThrowAsync("/customers/client-123");
    expect(mockStore.database.clients[0].automation_paused).toBe(true);
  });

  it("H3: should successfully create a new reminder (invoice)", async () => {
    mockStore.currentUser = { id: "user-123" };
    const formData = new FormData();
    formData.append("recipient_name", "Bob");
    formData.append("recipient_email", "bob@example.com");
    formData.append("amount_owed", "250.00");
    formData.append("reminder_frequency_days", "3");
    formData.append("currency", "USD");
    formData.append("custom_message", "Hello");

    await expect(createReminder(formData)).toThrowAsync("/reminders?success=Reminder+created");
    expect(mockStore.database.invoices.length).toBe(1);
    expect(mockStore.database.invoices[0].recipient_email).toBe("bob@example.com");
  });

  it("H4: should successfully pause and resume an active reminder", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.invoices.push({ id: "rem-111", user_id: "user-123", active: true });

    await expect(pauseReminder("rem-111")).toThrowAsync("/reminders?success=");
    expect(mockStore.database.invoices[0].active).toBe(false);

    await expect(resumeReminder("rem-111")).toThrowAsync("/reminders?success=");
    expect(mockStore.database.invoices[0].active).toBe(true);
  });

  it("H5: should successfully delete a reminder", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.invoices.push({ id: "rem-222", user_id: "user-123", active: true });

    await expect(deleteReminder("rem-222")).toThrowAsync("/reminders?success=");
    expect(mockStore.database.invoices.length).toBe(0);
  });

  it("H6: should successfully update draft content and approve a draft email via Resend", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.email_drafts.push({
      id: "draft-123",
      user_id: "user-123",
      subject: "Original Subject",
      body_html: "Original Body",
      recipient_email: "draft-user@example.com",
    });

    await updateDraftContent("draft-123", "New Subject", "New Body");
    expect(mockStore.database.email_drafts[0].subject).toBe("New Subject");

    await approveDraft("draft-123");
    expect(mockStore.resendEmails.length).toBe(1);
    expect(mockStore.resendEmails[0].to).toBe("draft-user@example.com");
    expect(mockStore.database.email_drafts.length).toBe(0); // deleted after sending
  });

  // --- BOUNDARY AND ERROR PATHS ---

  it("E1: createReminder should fail if recipient email format is invalid", async () => {
    mockStore.currentUser = { id: "user-123" };
    const formData = new FormData();
    formData.append("recipient_name", "Bob");
    formData.append("recipient_email", "invalidemail");
    formData.append("amount_owed", "200");
    formData.append("reminder_frequency_days", "3");

    await expect(createReminder(formData)).toThrowAsync("valid+recipient+email");
  });

  it("E2: createReminder should fail if amount owed is not a valid number", async () => {
    mockStore.currentUser = { id: "user-123" };
    const formData = new FormData();
    formData.append("recipient_name", "Bob");
    formData.append("recipient_email", "bob@example.com");
    formData.append("amount_owed", "abc");
    formData.append("reminder_frequency_days", "3");

    await expect(createReminder(formData)).toThrowAsync("valid+amount");
  });

  it("E3: createReminder should fail if reminder frequency is negative", async () => {
    mockStore.currentUser = { id: "user-123" };
    const formData = new FormData();
    formData.append("recipient_name", "Bob");
    formData.append("recipient_email", "bob@example.com");
    formData.append("amount_owed", "100");
    formData.append("reminder_frequency_days", "-1");

    await expect(createReminder(formData)).toThrowAsync("at+least+1+day");
  });

  it("E4: approveDraft should fail if draft is not found", async () => {
    mockStore.currentUser = { id: "user-123" };
    await expect(approveDraft("non-existent-draft")).toThrowAsync("Draft not found");
  });

  it("E5: updateDraftContent should fail if draft does not exist", async () => {
    mockStore.currentUser = { id: "user-123" };
    await expect(updateDraftContent("bad-draft", "sub", "body")).toThrowAsync("Draft not found");
  });
});
