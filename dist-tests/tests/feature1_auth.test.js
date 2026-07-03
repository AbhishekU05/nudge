"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../app/actions/auth");
const store_1 = require("./mocks/store");
const framework_1 = require("./framework");
(0, framework_1.describe)("Feature 1: Auth & Profile", () => {
    // --- HAPPY PATHS ---
    (0, framework_1.it)("H1: should successfully sign up a new user and redirect to login success page", async () => {
        const formData = new FormData();
        formData.append("email", "newuser@example.com");
        formData.append("password", "SecurePassword123");
        formData.append("confirm_password", "SecurePassword123");
        formData.append("full_name", "John Doe");
        formData.append("next", "/dashboard");
        await (0, framework_1.expect)((0, auth_1.signup)(formData)).toThrowAsync("/login?success=");
        (0, framework_1.expect)(store_1.mockStore.supabaseAuthUsers.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.supabaseAuthUsers[0].email).toBe("newuser@example.com");
        (0, framework_1.expect)(store_1.mockStore.database.organizations.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.organizations[0].name).toBe("John Doe's Workspace");
        (0, framework_1.expect)(store_1.mockStore.database.organizations[0].domain).toBe("example.com");
        (0, framework_1.expect)(store_1.mockStore.database.organization_members.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.organization_members[0].role).toBe("owner");
    });
    (0, framework_1.it)("H2: should successfully log in an existing user and redirect to next path", async () => {
        const user = { id: "user-123", email: "existing@example.com", user_metadata: {} };
        store_1.mockStore.supabaseAuthUsers.push(user);
        const formData = new FormData();
        formData.append("email", "existing@example.com");
        formData.append("password", "correct_password");
        formData.append("next", "/dashboard");
        await (0, framework_1.expect)((0, auth_1.login)(formData)).toThrowAsync("/dashboard");
        (0, framework_1.expect)(store_1.mockStore.currentUser.email).toBe("existing@example.com");
    });
    (0, framework_1.it)("H3: should successfully log out a user and redirect to login page", async () => {
        store_1.mockStore.currentUser = { id: "user-123", email: "test@example.com" };
        await (0, framework_1.expect)((0, auth_1.logout)()).toThrowAsync("/login");
        (0, framework_1.expect)(store_1.mockStore.currentUser).toBeNull();
    });
    (0, framework_1.it)("H4: should successfully update the profile name and redirect with success", async () => {
        store_1.mockStore.currentUser = { id: "user-123", email: "test@example.com", user_metadata: { full_name: "Old Name" } };
        store_1.mockStore.database.profiles = [{ user_id: "user-123", full_name: "Old Name" }];
        const formData = new FormData();
        formData.append("full_name", "New Name");
        await (0, framework_1.expect)((0, auth_1.updateProfileName)(formData)).toThrowAsync("/dashboard?success=");
        (0, framework_1.expect)(store_1.mockStore.currentUser.user_metadata.full_name).toBe("New Name");
        (0, framework_1.expect)(store_1.mockStore.database.profiles.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.profiles[0].full_name).toBe("New Name");
    });
    (0, framework_1.it)("H5: should successfully request password reset and redirect", async () => {
        const formData = new FormData();
        formData.append("email", "reset@example.com");
        await (0, framework_1.expect)((0, auth_1.requestPasswordReset)(formData)).toThrowAsync("/forgot-password?success=");
    });
    (0, framework_1.it)("H6: should reset password successfully if user is verified", async () => {
        store_1.mockStore.currentUser = { id: "user-123", email: "reset@example.com" };
        const formData = new FormData();
        formData.append("password", "NewSecurePassword");
        formData.append("confirm_password", "NewSecurePassword");
        await (0, framework_1.expect)((0, auth_1.resetPassword)(formData)).toThrowAsync("/login?success=");
    });
    (0, framework_1.it)("H7: should update weekly digest settings successfully", async () => {
        store_1.mockStore.currentUser = { id: "user-123", email: "test@example.com" };
        const formData = new FormData();
        formData.append("timezone", "UTC");
        formData.append("weekly_digest_enabled", "true");
        await (0, framework_1.expect)((0, auth_1.updateDigestSettings)(formData)).toThrowAsync("/settings/general?success=");
        (0, framework_1.expect)(store_1.mockStore.database.profiles.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.profiles[0].timezone).toBe("UTC");
        (0, framework_1.expect)(store_1.mockStore.database.profiles[0].weekly_digest_enabled).toBe(true);
    });
    (0, framework_1.it)("H8: should update profile info details successfully", async () => {
        store_1.mockStore.currentUser = { id: "user-123", email: "test@example.com" };
        const orgId = "org-123";
        store_1.mockStore.database.organizations = [{ id: orgId, name: "Old Company" }];
        store_1.mockStore.database.organization_members = [{ organization_id: orgId, user_id: "user-123", role: "owner" }];
        store_1.mockStore.database.profiles = [{ user_id: "user-123", full_name: "Old Name" }];
        const formData = new FormData();
        formData.append("first_name", "Jane");
        formData.append("last_name", "Doe");
        formData.append("company_name", "Nudge Inc");
        await (0, framework_1.expect)((0, auth_1.updateProfileInfo)(formData)).toThrowAsync("/settings/general?success=");
        (0, framework_1.expect)(store_1.mockStore.database.profiles.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.profiles[0].full_name).toBe("Jane Doe");
        (0, framework_1.expect)(store_1.mockStore.database.organizations.length).toBe(1);
        (0, framework_1.expect)(store_1.mockStore.database.organizations[0].name).toBe("Nudge Inc");
    });
    // --- BOUNDARY AND ERROR PATHS ---
    (0, framework_1.it)("E1: signup should fail if passwords do not match", async () => {
        const formData = new FormData();
        formData.append("email", "user@example.com");
        formData.append("password", "Pass1234");
        formData.append("confirm_password", "Pass5678");
        formData.append("full_name", "Name");
        await (0, framework_1.expect)((0, auth_1.signup)(formData)).toThrowAsync("/signup?error=Passwords+do+not+match");
    });
    (0, framework_1.it)("E2: signup should fail if email format is invalid", async () => {
        const formData = new FormData();
        formData.append("email", "bademail");
        formData.append("password", "Pass12345");
        formData.append("confirm_password", "Pass12345");
        formData.append("full_name", "Name");
        await (0, framework_1.expect)((0, auth_1.signup)(formData)).toThrowAsync("/signup?error=Enter+a+valid+email+address");
    });
    (0, framework_1.it)("E3: signup should fail if password is too short (< 8 chars)", async () => {
        const formData = new FormData();
        formData.append("email", "user@example.com");
        formData.append("password", "short");
        formData.append("confirm_password", "short");
        formData.append("full_name", "Name");
        await (0, framework_1.expect)((0, auth_1.signup)(formData)).toThrowAsync("/signup?error=Use+at+least+8+characters");
    });
    (0, framework_1.it)("E4: signup should fail if user already exists", async () => {
        store_1.mockStore.supabaseAuthUsers.push({ id: "user-123", email: "existing@example.com" });
        const formData = new FormData();
        formData.append("email", "existing@example.com");
        formData.append("password", "SecurePassword123");
        formData.append("confirm_password", "SecurePassword123");
        formData.append("full_name", "John");
        await (0, framework_1.expect)((0, auth_1.signup)(formData)).toThrowAsync("already+exists");
    });
    (0, framework_1.it)("E5: login should fail if email format is invalid", async () => {
        const formData = new FormData();
        formData.append("email", "bademail");
        formData.append("password", "somepass");
        await (0, framework_1.expect)((0, auth_1.login)(formData)).toThrowAsync("/login?error=Enter+a+valid+email+address");
    });
    (0, framework_1.it)("E6: login should throttle and fail immediately if too many failed attempts", async () => {
        store_1.mockStore.cookies.set("failed_login_attempts", { value: "3" });
        const formData = new FormData();
        formData.append("email", "user@example.com");
        formData.append("password", "somepass");
        await (0, framework_1.expect)((0, auth_1.login)(formData)).toThrowAsync("Too+many+failed+attempts");
    });
    (0, framework_1.it)("E7: updateProfileName should fail if name is longer than 100 characters", async () => {
        store_1.mockStore.currentUser = { id: "user-123" };
        const formData = new FormData();
        formData.append("full_name", "a".repeat(101));
        await (0, framework_1.expect)((0, auth_1.updateProfileName)(formData)).toThrowAsync("too+long");
    });
    (0, framework_1.it)("E8: resetPassword should fail if user is not authenticated", async () => {
        store_1.mockStore.currentUser = null;
        const formData = new FormData();
        formData.append("password", "NewPassword123");
        formData.append("confirm_password", "NewPassword123");
        await (0, framework_1.expect)((0, auth_1.resetPassword)(formData)).toThrowAsync("/forgot-password?error=");
    });
    (0, framework_1.it)("E9: updateProfileInfo should fail if user is not logged in", async () => {
        store_1.mockStore.currentUser = null;
        const formData = new FormData();
        await (0, framework_1.expect)((0, auth_1.updateProfileInfo)(formData)).toThrowAsync("/login");
    });
});
