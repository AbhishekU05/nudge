"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const feedback_1 = require("../app/actions/feedback");
const leads_1 = require("../app/actions/leads");
const store_1 = require("./mocks/store");
const framework_1 = require("./framework");
(0, framework_1.describe)("Feature 5: Public Engagement & Marketing", () => {
    // --- HAPPY PATHS ---
    (0, framework_1.it)("H1: should successfully submit feedback and redirect with success", async () => {
        store_1.mockStore.currentUser = { id: "user-123", email: "user@example.com" };
        const orgId = "org-123";
        store_1.mockStore.database.organizations = [{ id: orgId, name: "Acme Corp" }];
        store_1.mockStore.database.organization_members = [{ organization_id: orgId, user_id: "user-123", role: "member" }];
        const formData = new FormData();
        formData.append("message", "This app is wonderful!");
        await (0, framework_1.expect)((0, feedback_1.submitFeedback)(formData)).toThrowAsync("/dashboard?success=");
        (0, framework_1.expect)(store_1.mockStore.feedbackEmails.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.feedbackEmails[0].message).toContain("This app is wonderful!");
        (0, framework_1.expect)(store_1.mockStore.feedbackEmails[0].message).toContain("Acme Corp");
        (0, framework_1.expect)(store_1.mockStore.feedbackEmails[0].message).toContain("org-123");
    });
    (0, framework_1.it)("H2: should successfully capture a public lead", async () => {
        const email = "lead@example.com";
        await (0, leads_1.captureLead)(email);
        (0, framework_1.expect)(store_1.mockStore.database.leads.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.leads[0].email).toBe("lead@example.com");
    });
    (0, framework_1.it)("H3: should successfully capture a lifetime deal lead and revalidate layout", async () => {
        const email = "lifetime@example.com";
        const res = await (0, leads_1.captureLifetimeDealLead)(email);
        (0, framework_1.expect)(res.success).toBe(true);
        (0, framework_1.expect)(store_1.mockStore.database.leads.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.leads[0].referral_source).toBe("lifetime_deal");
        (0, framework_1.expect)(store_1.mockStore.revalidatedPaths.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.revalidatedPaths[0].path).toBe("/");
    });
    (0, framework_1.it)("H4: should return max spots (10) when no lifetime leads exist", async () => {
        const spots = await (0, leads_1.getRemainingLifetimeSpots)();
        (0, framework_1.expect)(spots).toBe(10);
    });
    (0, framework_1.it)("H5: should calculate correct remaining spots when some exist", async () => {
        store_1.mockStore.database.leads.push({ email: "1@test.com", referral_source: "lifetime_deal" }, { email: "2@test.com", referral_source: "lifetime_deal" }, { email: "3@test.com", referral_source: "lifetime_deal" });
        const spots = await (0, leads_1.getRemainingLifetimeSpots)();
        (0, framework_1.expect)(spots).toBe(7); // 10 - 3
    });
    // --- BOUNDARY AND ERROR PATHS ---
    (0, framework_1.it)("E1: submitFeedback should fail if feedback message is empty", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        const formData = new FormData();
        formData.append("message", "  ");
        await (0, framework_1.expect)((0, feedback_1.submitFeedback)(formData)).toThrowAsync("/feedback?error=Feedback+message+is+required");
    });
    (0, framework_1.it)("E2: submitFeedback should fail if feedback message is too long (> 2000 chars)", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        const formData = new FormData();
        formData.append("message", "a".repeat(2001));
        await (0, framework_1.expect)((0, feedback_1.submitFeedback)(formData)).toThrowAsync("/feedback?error=Feedback+message+is+too+long");
    });
    (0, framework_1.it)("E3: submitFeedback should redirect with error if feedback sending throws", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        // Trigger feedback sending mock error:
        store_1.mockStore.dbErrors.profiles = new Error("Mock SMTP error"); // trigger catch block if anything throws, actually feedback action calls sendFeedbackEmail which we can make throw.
        // In sendFeedbackEmail mock, we can throw if some condition is met, let's say message is "error" or if we force mockStore.feedbackEmails to throw:
        // Let's modify tests/mocks/external.ts so sendFeedbackEmail throws if mockStore.feedbackEmails is null
        store_1.mockStore.feedbackEmails = null;
        const formData = new FormData();
        formData.append("message", "Test error");
        await (0, framework_1.expect)((0, feedback_1.submitFeedback)(formData)).toThrowAsync("/feedback?error=");
    });
    (0, framework_1.it)("E4: captureLead should silently catch and ignore database insertion errors", async () => {
        store_1.mockStore.dbErrors.leads = new Error("Unique constraint violation");
        // captureLead should log error but not crash
        await (0, leads_1.captureLead)("duplicate@example.com");
    });
    (0, framework_1.it)("E5: captureLifetimeDealLead should return failure if database query errors out", async () => {
        store_1.mockStore.dbErrors.leads = new Error("DB Connection Error");
        const res = await (0, leads_1.captureLifetimeDealLead)("error@example.com");
        (0, framework_1.expect)(res.success).toBe(false);
        (0, framework_1.expect)(res.error).toBe("unknown");
    });
    (0, framework_1.it)("E6: getRemainingLifetimeSpots should return max spots if database query errors out", async () => {
        store_1.mockStore.dbErrors.leads = new Error("DB Error");
        const spots = await (0, leads_1.getRemainingLifetimeSpots)();
        (0, framework_1.expect)(spots).toBe(10);
    });
});
