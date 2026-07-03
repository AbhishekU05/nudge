"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const integrations_1 = require("../app/actions/integrations");
const store_1 = require("./mocks/store");
const framework_1 = require("./framework");
(0, framework_1.describe)("Feature 4: Third-party Integrations", () => {
    // --- HAPPY PATHS ---
    (0, framework_1.it)("H1: should successfully sync Xero now and redirect with success status", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.syncResults = { imported: 10, updated: 5, markedPaid: 2 };
        await (0, framework_1.expect)((0, integrations_1.syncXeroNow)()).toThrowAsync("Xero+sync+complete.+Imported+10,+updated+5,+marked+paid+2");
        (0, framework_1.expect)(store_1.mockStore.xeroSynced).toBe(true);
    });
    (0, framework_1.it)("H2: should successfully disconnect Xero and delete integration from DB", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.integrations.push({ user_id: "user-123", provider: "xero" });
        await (0, framework_1.expect)((0, integrations_1.disconnectXero)()).toThrowAsync("Xero+disconnected");
        (0, framework_1.expect)(store_1.mockStore.xeroRevoked).toBe(true);
        (0, framework_1.expect)(store_1.mockStore.database.integrations.length).toBe(0);
    });
    (0, framework_1.it)("H3: should successfully sync QuickBooks now and redirect with success status", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.syncResults = { imported: 4, updated: 3, markedPaid: 1 };
        await (0, framework_1.expect)((0, integrations_1.syncQuickBooksNow)()).toThrowAsync("QuickBooks+sync+complete");
        (0, framework_1.expect)(store_1.mockStore.quickbooksSynced).toBe(true);
    });
    (0, framework_1.it)("H4: should successfully disconnect QuickBooks and delete integration from DB", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.integrations.push({ user_id: "user-123", provider: "quickbooks" });
        await (0, framework_1.expect)((0, integrations_1.disconnectQuickBooks)()).toThrowAsync("QuickBooks+disconnected");
        (0, framework_1.expect)(store_1.mockStore.quickbooksRevoked).toBe(true);
        (0, framework_1.expect)(store_1.mockStore.database.integrations.length).toBe(0);
    });
    (0, framework_1.it)("H5: should successfully disconnect Gmail and reset google tokens in profile", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.profiles.push({
            user_id: "user-123",
            google_access_token: "token",
            google_refresh_token: "refresh",
            gmail_connected_email: "gmail@test.com",
        });
        await (0, framework_1.expect)((0, integrations_1.disconnectGmail)()).toThrowAsync("Gmail+disconnected");
        (0, framework_1.expect)(store_1.mockStore.database.profiles[0].google_access_token).toBeNull();
    });
    (0, framework_1.it)("H6: should successfully sync integration in the background", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.syncResults = { imported: 5, updated: 1, markedPaid: 0 };
        const res = await (0, integrations_1.syncIntegrationBackground)("xero");
        (0, framework_1.expect)(res.success).toBe(true);
        (0, framework_1.expect)(res.message).toContain("Synced 5 imported, 1 updated");
    });
    (0, framework_1.it)("H7: should perform daily background sync for stale integrations", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.integrations.push({
            user_id: "user-123",
            provider: "xero",
            last_synced_at: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString(), // 2 days ago
        });
        const res = await (0, integrations_1.dailyBackgroundSync)();
        (0, framework_1.expect)(res.success).toBe(true);
        (0, framework_1.expect)(store_1.mockStore.xeroSynced).toBe(true);
    });
    // --- BOUNDARY AND ERROR PATHS ---
    (0, framework_1.it)("E1: syncXeroNow should redirect with error if third-party call throws", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        // We override Xero sync implementation to throw an error
        store_1.mockStore.syncResults = null; // force error / crash
        // In dynamic require mapping we mock it. If we can also mock syncXeroInvoicesForUser to fail
        // let's do that or simulate Xero SDK throws.
        // In our mocks, we can support configured error:
        store_1.mockStore.syncResults = { imported: 0, updated: 0, markedPaid: 0 };
        // Let's change the mock implementation to throw if a flag is set, or simply:
        // We can simulate an error by making require throw or using process.env, but let's make the mock sync implementation throw if a flag is set.
        // For simplicity, let's look at what syncXeroInvoicesForUser does in tests/mocks/external.ts:
        // It returns mockStore.syncResults. If syncResults is null, it will crash and throw.
        store_1.mockStore.syncResults = null;
        await (0, framework_1.expect)((0, integrations_1.syncXeroNow)()).toThrowAsync("Unable+to+sync+Xero");
    });
    (0, framework_1.it)("E2: disconnectXero should redirect with error if database delete fails", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.dbErrors.integrations = new Error("DB Error");
        await (0, framework_1.expect)((0, integrations_1.disconnectXero)()).toThrowAsync("Unable+to+disconnect+Xero");
    });
    (0, framework_1.it)("E3: syncQuickBooksNow should redirect with error if third-party call throws", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.syncResults = null; // trigger catch block
        await (0, framework_1.expect)((0, integrations_1.syncQuickBooksNow)()).toThrowAsync("Unable+to+sync+QuickBooks");
    });
    (0, framework_1.it)("E4: disconnectQuickBooks should redirect with error if database delete fails", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.dbErrors.integrations = new Error("DB Error");
        await (0, framework_1.expect)((0, integrations_1.disconnectQuickBooks)()).toThrowAsync("Unable+to+disconnect+QuickBooks");
    });
    (0, framework_1.it)("E5: disconnectGmail should redirect with error if database update fails", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.dbErrors.profiles = new Error("DB Error");
        await (0, framework_1.expect)((0, integrations_1.disconnectGmail)()).toThrowAsync("Unable+to+disconnect+Gmail");
    });
    (0, framework_1.it)("E6: syncIntegrationBackground should return failure message if sync throws", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.syncResults = null; // trigger error
        const res = await (0, integrations_1.syncIntegrationBackground)("quickbooks");
        (0, framework_1.expect)(res.success).toBe(false);
        (0, framework_1.expect)(res.message).toContain("Unable to sync");
    });
    (0, framework_1.it)("E7: dailyBackgroundSync should return false response if there are no integrations", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        store_1.mockStore.database.integrations = [];
        const res = await (0, integrations_1.dailyBackgroundSync)();
        (0, framework_1.expect)(res.success).toBe(false);
        (0, framework_1.expect)(res.message).toBe("No integrations");
    });
});
