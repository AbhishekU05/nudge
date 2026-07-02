import {
  signup,
  login,
  logout,
  updateProfileName,
  signInWithGoogle,
  requestPasswordReset,
  resetPassword,
  updateDigestSettings,
  updateProfileInfo,
} from "../app/actions/auth";
import { mockStore } from "./mocks/store";
import { describe, it, expect } from "./framework";

describe("Feature 1: Auth & Profile", () => {
  // --- HAPPY PATHS ---

  it("H1: should successfully sign up a new user and redirect to login success page", async () => {
    const formData = new FormData();
    formData.append("email", "newuser@example.com");
    formData.append("password", "SecurePassword123");
    formData.append("confirm_password", "SecurePassword123");
    formData.append("full_name", "John Doe");
    formData.append("next", "/dashboard");

    await expect(signup(formData)).toThrowAsync("/login?success=");
    expect(mockStore.supabaseAuthUsers.length).toBe(1);
    expect(mockStore.supabaseAuthUsers[0].email).toBe("newuser@example.com");
    expect(mockStore.database.organizations.length).toBe(1);
    expect(mockStore.database.organizations[0].name).toBe("John Doe's Workspace");
    expect(mockStore.database.organizations[0].domain).toBe("example.com");
    expect(mockStore.database.organization_members.length).toBe(1);
    expect(mockStore.database.organization_members[0].role).toBe("owner");
  });

  it("H2: should successfully log in an existing user and redirect to next path", async () => {
    const user = { id: "user-123", email: "existing@example.com", user_metadata: {} };
    mockStore.supabaseAuthUsers.push(user);

    const formData = new FormData();
    formData.append("email", "existing@example.com");
    formData.append("password", "correct_password");
    formData.append("next", "/dashboard");

    await expect(login(formData)).toThrowAsync("/dashboard");
    expect(mockStore.currentUser.email).toBe("existing@example.com");
  });

  it("H3: should successfully log out a user and redirect to login page", async () => {
    mockStore.currentUser = { id: "user-123", email: "test@example.com" };
    await expect(logout()).toThrowAsync("/login");
    expect(mockStore.currentUser).toBeNull();
  });

  it("H4: should successfully update the profile name and redirect with success", async () => {
    mockStore.currentUser = { id: "user-123", email: "test@example.com", user_metadata: { full_name: "Old Name" } };
    mockStore.database.profiles = [{ user_id: "user-123", full_name: "Old Name" }];
    const formData = new FormData();
    formData.append("full_name", "New Name");

    await expect(updateProfileName(formData)).toThrowAsync("/dashboard?success=");
    expect(mockStore.currentUser.user_metadata.full_name).toBe("New Name");
    expect(mockStore.database.profiles.length).toBe(1);
    expect(mockStore.database.profiles[0].full_name).toBe("New Name");
  });

  it("H5: should successfully request password reset and redirect", async () => {
    const formData = new FormData();
    formData.append("email", "reset@example.com");

    await expect(requestPasswordReset(formData)).toThrowAsync("/forgot-password?success=");
  });

  it("H6: should reset password successfully if user is verified", async () => {
    mockStore.currentUser = { id: "user-123", email: "reset@example.com" };
    const formData = new FormData();
    formData.append("password", "NewSecurePassword");
    formData.append("confirm_password", "NewSecurePassword");

    await expect(resetPassword(formData)).toThrowAsync("/login?success=");
  });

  it("H7: should update weekly digest settings successfully", async () => {
    mockStore.currentUser = { id: "user-123", email: "test@example.com" };
    const formData = new FormData();
    formData.append("timezone", "UTC");
    formData.append("weekly_digest_enabled", "true");

    await expect(updateDigestSettings(formData)).toThrowAsync("/settings/general?success=");
    expect(mockStore.database.profiles.length).toBe(1);
    expect(mockStore.database.profiles[0].timezone).toBe("UTC");
    expect(mockStore.database.profiles[0].weekly_digest_enabled).toBe(true);
  });

  it("H8: should update profile info details successfully", async () => {
    mockStore.currentUser = { id: "user-123", email: "test@example.com" };
    const orgId = "org-123";
    mockStore.database.organizations = [{ id: orgId, name: "Old Company" }];
    mockStore.database.organization_members = [{ organization_id: orgId, user_id: "user-123", role: "owner" }];
    mockStore.database.profiles = [{ user_id: "user-123", full_name: "Old Name" }];

    const formData = new FormData();
    formData.append("first_name", "Jane");
    formData.append("last_name", "Doe");
    formData.append("company_name", "Nudge Inc");

    await expect(updateProfileInfo(formData)).toThrowAsync("/settings/general?success=");
    expect(mockStore.database.profiles.length).toBe(1);
    expect(mockStore.database.profiles[0].full_name).toBe("Jane Doe");
    expect(mockStore.database.organizations.length).toBe(1);
    expect(mockStore.database.organizations[0].name).toBe("Nudge Inc");
  });

  // --- BOUNDARY AND ERROR PATHS ---

  it("E1: signup should fail if passwords do not match", async () => {
    const formData = new FormData();
    formData.append("email", "user@example.com");
    formData.append("password", "Pass1234");
    formData.append("confirm_password", "Pass5678");
    formData.append("full_name", "Name");

    await expect(signup(formData)).toThrowAsync("/signup?error=Passwords+do+not+match");
  });

  it("E2: signup should fail if email format is invalid", async () => {
    const formData = new FormData();
    formData.append("email", "bademail");
    formData.append("password", "Pass12345");
    formData.append("confirm_password", "Pass12345");
    formData.append("full_name", "Name");

    await expect(signup(formData)).toThrowAsync("/signup?error=Enter+a+valid+email+address");
  });

  it("E3: signup should fail if password is too short (< 8 chars)", async () => {
    const formData = new FormData();
    formData.append("email", "user@example.com");
    formData.append("password", "short");
    formData.append("confirm_password", "short");
    formData.append("full_name", "Name");

    await expect(signup(formData)).toThrowAsync("/signup?error=Use+at+least+8+characters");
  });

  it("E4: signup should fail if user already exists", async () => {
    mockStore.supabaseAuthUsers.push({ id: "user-123", email: "existing@example.com" });

    const formData = new FormData();
    formData.append("email", "existing@example.com");
    formData.append("password", "SecurePassword123");
    formData.append("confirm_password", "SecurePassword123");
    formData.append("full_name", "John");

    await expect(signup(formData)).toThrowAsync("already+exists");
  });

  it("E5: login should fail if email format is invalid", async () => {
    const formData = new FormData();
    formData.append("email", "bademail");
    formData.append("password", "somepass");

    await expect(login(formData)).toThrowAsync("/login?error=Enter+a+valid+email+address");
  });

  it("E6: login should throttle and fail immediately if too many failed attempts", async () => {
    mockStore.cookies.set("failed_login_attempts", { value: "3" });

    const formData = new FormData();
    formData.append("email", "user@example.com");
    formData.append("password", "somepass");

    await expect(login(formData)).toThrowAsync("Too+many+failed+attempts");
  });

  it("E7: updateProfileName should fail if name is longer than 100 characters", async () => {
    mockStore.currentUser = { id: "user-123" };
    const formData = new FormData();
    formData.append("full_name", "a".repeat(101));

    await expect(updateProfileName(formData)).toThrowAsync("too+long");
  });

  it("E8: resetPassword should fail if user is not authenticated", async () => {
    mockStore.currentUser = null;
    const formData = new FormData();
    formData.append("password", "NewPassword123");
    formData.append("confirm_password", "NewPassword123");

    await expect(resetPassword(formData)).toThrowAsync("/forgot-password?error=");
  });

  it("E9: updateProfileInfo should fail if user is not logged in", async () => {
    mockStore.currentUser = null;
    const formData = new FormData();
    await expect(updateProfileInfo(formData)).toThrowAsync("/login");
  });
});
