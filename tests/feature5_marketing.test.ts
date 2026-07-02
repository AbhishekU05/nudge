import { submitFeedback } from "../app/actions/feedback";
import { captureLead, captureLifetimeDealLead, getRemainingLifetimeSpots } from "../app/actions/leads";
import { mockStore } from "./mocks/store";
import { describe, it, expect } from "./framework";

describe("Feature 5: Public Engagement & Marketing", () => {
  // --- HAPPY PATHS ---

  it("H1: should successfully submit feedback and redirect with success", async () => {
    mockStore.currentUser = { id: "user-123", email: "user@example.com" };
    const orgId = "org-123";
    mockStore.database.organizations = [{ id: orgId, name: "Acme Corp" }];
    mockStore.database.organization_members = [{ organization_id: orgId, user_id: "user-123", role: "member" }];

    const formData = new FormData();
    formData.append("message", "This app is wonderful!");

    await expect(submitFeedback(formData)).toThrowAsync("/dashboard?success=");
    expect(mockStore.feedbackEmails.length).toBe(1);
    expect(mockStore.feedbackEmails[0].message).toContain("This app is wonderful!");
    expect(mockStore.feedbackEmails[0].message).toContain("Acme Corp");
    expect(mockStore.feedbackEmails[0].message).toContain("org-123");
  });

  it("H2: should successfully capture a public lead", async () => {
    const email = "lead@example.com";
    await captureLead(email);
    expect(mockStore.database.leads.length).toBe(1);
    expect(mockStore.database.leads[0].email).toBe("lead@example.com");
  });

  it("H3: should successfully capture a lifetime deal lead and revalidate layout", async () => {
    const email = "lifetime@example.com";
    const res = await captureLifetimeDealLead(email);
    expect(res.success).toBe(true);
    expect(mockStore.database.leads.length).toBe(1);
    expect(mockStore.database.leads[0].referral_source).toBe("lifetime_deal");
    expect(mockStore.revalidatedPaths.length).toBe(1);
    expect(mockStore.revalidatedPaths[0].path).toBe("/");
  });

  it("H4: should return max spots (10) when no lifetime leads exist", async () => {
    const spots = await getRemainingLifetimeSpots();
    expect(spots).toBe(10);
  });

  it("H5: should calculate correct remaining spots when some exist", async () => {
    mockStore.database.leads.push(
      { email: "1@test.com", referral_source: "lifetime_deal" },
      { email: "2@test.com", referral_source: "lifetime_deal" },
      { email: "3@test.com", referral_source: "lifetime_deal" }
    );
    const spots = await getRemainingLifetimeSpots();
    expect(spots).toBe(7); // 10 - 3
  });

  // --- BOUNDARY AND ERROR PATHS ---

  it("E1: submitFeedback should fail if feedback message is empty", async () => {
    mockStore.currentUser = { id: "user-123" };
    const formData = new FormData();
    formData.append("message", "  ");

    await expect(submitFeedback(formData)).toThrowAsync("/feedback?error=Feedback+message+is+required");
  });

  it("E2: submitFeedback should fail if feedback message is too long (> 2000 chars)", async () => {
    mockStore.currentUser = { id: "user-123" };
    const formData = new FormData();
    formData.append("message", "a".repeat(2001));

    await expect(submitFeedback(formData)).toThrowAsync("/feedback?error=Feedback+message+is+too+long");
  });

  it("E3: submitFeedback should redirect with error if feedback sending throws", async () => {
    mockStore.currentUser = { id: "user-123" };
    // Trigger feedback sending mock error:
    mockStore.dbErrors.profiles = new Error("Mock SMTP error"); // trigger catch block if anything throws, actually feedback action calls sendFeedbackEmail which we can make throw.
    // In sendFeedbackEmail mock, we can throw if some condition is met, let's say message is "error" or if we force mockStore.feedbackEmails to throw:
    // Let's modify tests/mocks/external.ts so sendFeedbackEmail throws if mockStore.feedbackEmails is null
    mockStore.feedbackEmails = null as any;

    const formData = new FormData();
    formData.append("message", "Test error");

    await expect(submitFeedback(formData)).toThrowAsync("/feedback?error=");
  });

  it("E4: captureLead should silently catch and ignore database insertion errors", async () => {
    mockStore.dbErrors.leads = new Error("Unique constraint violation");
    // captureLead should log error but not crash
    await captureLead("duplicate@example.com");
  });

  it("E5: captureLifetimeDealLead should return failure if database query errors out", async () => {
    mockStore.dbErrors.leads = new Error("DB Connection Error");
    const res = await captureLifetimeDealLead("error@example.com");
    expect(res.success).toBe(false);
    expect(res.error).toBe("unknown");
  });

  it("E6: getRemainingLifetimeSpots should return max spots if database query errors out", async () => {
    mockStore.dbErrors.leads = new Error("DB Error");
    const spots = await getRemainingLifetimeSpots();
    expect(spots).toBe(10);
  });
});
