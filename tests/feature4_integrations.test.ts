import {
  syncXeroNow,
  disconnectXero,
  disconnectQuickBooks,
  disconnectGmail,
  dailyBackgroundSync,
} from "../app/actions/integrations";
import { mockStore } from "./mocks/store";
import { describe, it, expect } from "./framework";

describe("Feature 4: Third-party Integrations", () => {
  // --- HAPPY PATHS ---

  it("H1: should successfully sync Xero now and redirect with success status", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.syncResults = { imported: 10, updated: 5, markedPaid: 2 };

    await expect(syncXeroNow()).toThrowAsync("Xero+sync+complete.+Imported+10,+updated+5,+marked+paid+2");
    expect(mockStore.xeroSynced).toBe(true);
  });

  it("H2: should successfully disconnect Xero and delete integration from DB", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.integrations.push({ user_id: "user-123", provider: "xero" });

    await expect(disconnectXero()).toThrowAsync("Xero+disconnected");
    expect(mockStore.xeroRevoked).toBe(true);
    expect(mockStore.database.integrations.length).toBe(0);
  });

  it("H4: should successfully disconnect QuickBooks and delete integration from DB", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.integrations.push({ user_id: "user-123", provider: "quickbooks" });

    await expect(disconnectQuickBooks()).toThrowAsync("QuickBooks+disconnected");
    expect(mockStore.quickbooksRevoked).toBe(true);
    expect(mockStore.database.integrations.length).toBe(0);
  });

  it("H5: should successfully disconnect Gmail and reset google tokens in profile", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.profiles.push({
      user_id: "user-123",
      google_access_token: "token",
      google_refresh_token: "refresh",
      gmail_connected_email: "gmail@test.com",
    });

    await expect(disconnectGmail()).toThrowAsync("Gmail+disconnected");
    expect(mockStore.database.profiles[0].google_access_token).toBeNull();
  });

  it("H7: should perform daily background sync for stale integrations", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.integrations.push({
      user_id: "user-123",
      provider: "xero",
      last_synced_at: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString(), // 2 days ago
    });

    const res = await dailyBackgroundSync();
    expect(res.success).toBe(true);
    expect(mockStore.xeroSynced).toBe(true);
  });

  // --- BOUNDARY AND ERROR PATHS ---

  it("E1: syncXeroNow should redirect with error if third-party call throws", async () => {
    mockStore.currentUser = { id: "user-123" };
    // We override Xero sync implementation to throw an error
    mockStore.syncResults = null as any; // force error / crash

    // In dynamic require mapping we mock it. If we can also mock syncXeroInvoicesForUser to fail
    // let's do that or simulate Xero SDK throws.
    // In our mocks, we can support configured error:
    mockStore.syncResults = { imported: 0, updated: 0, markedPaid: 0 };
    // Let's change the mock implementation to throw if a flag is set, or simply:
    // We can simulate an error by making require throw or using process.env, but let's make the mock sync implementation throw if a flag is set.
    // For simplicity, let's look at what syncXeroInvoicesForUser does in tests/mocks/external.ts:
    // It returns mockStore.syncResults. If syncResults is null, it will crash and throw.
    mockStore.syncResults = null as any;

    await expect(syncXeroNow()).toThrowAsync("Unable+to+sync+Xero");
  });

  it("E2: disconnectXero should redirect with error if database delete fails", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.dbErrors.integrations = new Error("DB Error");

    await expect(disconnectXero()).toThrowAsync("Unable+to+disconnect+Xero");
  });

  it("E4: disconnectQuickBooks should redirect with error if database delete fails", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.dbErrors.integrations = new Error("DB Error");

    await expect(disconnectQuickBooks()).toThrowAsync("Unable+to+disconnect+QuickBooks");
  });

  it("E5: disconnectGmail should redirect with error if database update fails", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.dbErrors.profiles = new Error("DB Error");

    await expect(disconnectGmail()).toThrowAsync("Unable+to+disconnect+Gmail");
  });

  it("E7: dailyBackgroundSync should return false response if there are no integrations", async () => {
    mockStore.currentUser = { id: "user-123" };
    mockStore.database.integrations = [];

    const res = await dailyBackgroundSync();
    expect(res.success).toBe(false);
    expect(res.message).toBe("No integrations");
  });
});
