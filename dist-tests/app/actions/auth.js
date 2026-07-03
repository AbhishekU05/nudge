"use strict";
/*
 * all logic for auth, signup, signin etc
 */
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.logout = logout;
exports.updateProfileName = updateProfileName;
exports.signInWithGoogle = signInWithGoogle;
exports.requestPasswordReset = requestPasswordReset;
exports.resetPassword = resetPassword;
exports.updateDigestSettings = updateDigestSettings;
exports.updateProfileInfo = updateProfileInfo;
const headers_1 = require("next/headers");
const navigation_1 = require("next/navigation");
const auth_errors_1 = require("@/lib/auth-errors");
const auth_providers_1 = require("@/lib/auth-providers");
const env_1 = require("@/lib/env");
const paths_1 = require("@/lib/paths");
const admin_1 = require("@/lib/supabase/admin");
const server_1 = require("@/lib/supabase/server");
// Extracts string from form in website
// TODO: make sure this is csec safe
function getString(formData, key) {
    const value = formData.get(key);
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`Missing field: ${key}`);
    }
    return value.trim();
}
// Same as previous function for some reason?? 
function getOptionalString(formData, key) {
    const value = formData.get(key);
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
// gets the next redirect safely
// TODO: make sure its actually safe
function getNextPath(formData) {
    return (0, paths_1.getSafeNextPath)(getOptionalString(formData, "next"));
}
// gets next url based on auth action
// TODO: make sure this one is also safe
function getAuthCallbackUrl(nextPath) {
    const appUrl = (0, env_1.getRequiredEnv)("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
    const callbackUrl = new URL("/auth/callback", appUrl);
    callbackUrl.searchParams.set("next", nextPath);
    return callbackUrl.toString();
}
// basic email format validation
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function getSignupErrorPath({ error, nextPath, email, }) {
    return (0, paths_1.buildPathWithQuery)("/signup", {
        error,
        email,
        next: nextPath !== "/dashboard" ? nextPath : null,
    });
}
async function isExistingAuthEmail(email) {
    const adminSupabase = (0, admin_1.createSupabaseAdminClient)();
    const normalizedEmail = email.toLowerCase();
    const perPage = 1000;
    for (let page = 1; page <= 10; page += 1) {
        const { data, error } = await adminSupabase.auth.admin.listUsers({
            page,
            perPage,
        });
        if (error)
            return false;
        if (data.users.some((user) => user.email?.toLowerCase() === normalizedEmail)) {
            return true;
        }
        if (data.users.length < perPage) {
            return false;
        }
    }
    return false;
}
// registers a new user
async function signup(formData) {
    const nextPath = getNextPath(formData);
    const email = getString(formData, "email").toLowerCase();
    const password = getString(formData, "password");
    const confirmPassword = getString(formData, "confirm_password");
    const fullName = getString(formData, "full_name");
    // TODO: check this redirect. redirect back to signup?
    if (password !== confirmPassword) {
        (0, navigation_1.redirect)(getSignupErrorPath({ error: "Passwords do not match.", nextPath, email }));
    }
    // TODO: why are we redirecting to dashboard here aaaaaaaah
    if (!validateEmail(email)) {
        (0, navigation_1.redirect)(getSignupErrorPath({ error: "Enter a valid email address.", nextPath, email }));
    }
    // TODO: again?? why the dashboard
    if (password.length < 8) {
        (0, navigation_1.redirect)(getSignupErrorPath({ error: "Use at least 8 characters for your password.", nextPath, email }));
    }
    if (await isExistingAuthEmail(email)) {
        (0, navigation_1.redirect)(getSignupErrorPath({
            error: "An account with this email already exists. Log in instead.",
            nextPath,
            email,
        }));
    }
    const cookieStore = await (0, headers_1.cookies)();
    const referralSource = cookieStore.get("nudge_referral")?.value;
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: getAuthCallbackUrl(nextPath),
            data: {
                full_name: fullName,
                referral_source: referralSource || null,
            },
        },
    });
    // TODO: bruhh just fix the redirect
    if (error) {
        (0, navigation_1.redirect)(getSignupErrorPath({ error: "Something went wrong. Please try again.", nextPath, email }));
    }
    if (data.user?.identities && data.user.identities.length === 0) {
        (0, navigation_1.redirect)(getSignupErrorPath({
            error: "An account with this email already exists. Log in instead.",
            nextPath,
            email,
        }));
    }
    if (data.user) {
        const domain = email.split("@")[1]?.toLowerCase();
        const PERSONAL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com"];
        const isPersonal = PERSONAL_DOMAINS.includes(domain);
        const adminSupabase = (0, admin_1.createSupabaseAdminClient)();
        if (!isPersonal && domain) {
            const { data: existingOrg } = await adminSupabase
                .from("organizations")
                .select("id")
                .eq("domain", domain)
                .maybeSingle();
            if (existingOrg) {
                const memberRole = "member";
                await adminSupabase.from("organization_members").insert({
                    organization_id: existingOrg.id,
                    user_id: data.user.id,
                    role: memberRole,
                });
            }
            else {
                const { data: newOrg } = await adminSupabase
                    .from("organizations")
                    .insert({
                    name: `${fullName}'s Workspace`,
                    domain: domain,
                })
                    .select("id")
                    .single();
                if (newOrg) {
                    const ownerRole = "owner";
                    await adminSupabase.from("organization_members").insert({
                        organization_id: newOrg.id,
                        user_id: data.user.id,
                        role: ownerRole,
                    });
                }
            }
        }
        else {
            const { data: newOrg } = await adminSupabase
                .from("organizations")
                .insert({
                name: `${fullName}'s Workspace`,
                domain: null,
            })
                .select("id")
                .single();
            if (newOrg) {
                const ownerRole = "owner";
                await adminSupabase.from("organization_members").insert({
                    organization_id: newOrg.id,
                    user_id: data.user.id,
                    role: ownerRole,
                });
            }
        }
    }
    if (data.session) {
        (0, navigation_1.redirect)(nextPath);
    }
    (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/login", {
        success: "Check your email to confirm your account.",
        next: nextPath !== "/dashboard" ? nextPath : null,
    }));
}
async function login(formData) {
    const nextPath = getNextPath(formData);
    const email = getString(formData, "email").toLowerCase();
    const password = getString(formData, "password");
    if (!validateEmail(email)) {
        (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/login", {
            error: "Enter a valid email address.",
            next: nextPath !== "/dashboard" ? nextPath : null,
        }));
    }
    const cookieStore = await (0, headers_1.cookies)();
    const attemptsCookie = cookieStore.get("failed_login_attempts")?.value;
    let attempts = attemptsCookie ? parseInt(attemptsCookie, 10) : 0;
    if (attempts >= 3) {
        (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/login", {
            error: "Too many failed attempts. Please wait before trying again.",
            next: nextPath !== "/dashboard" ? nextPath : null,
        }));
    }
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        attempts += 1;
        cookieStore.set("failed_login_attempts", attempts.toString(), { maxAge: 900, path: '/' });
        let errorMessage = "Something went wrong. Please try again.";
        if (attempts >= 3) {
            errorMessage = "Too many failed attempts. Please wait before trying again.";
        }
        else if (error.message.toLowerCase().includes("invalid login credentials")) {
            errorMessage = "Invalid email or password. If you don't have an account, please sign up.";
        }
        (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/login", {
            error: errorMessage,
            next: nextPath !== "/dashboard" ? nextPath : null,
        }));
    }
    cookieStore.delete("failed_login_attempts");
    (0, navigation_1.redirect)(nextPath);
}
// logs out user
async function logout() {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    await supabase.auth.signOut();
    (0, navigation_1.redirect)("/login");
}
async function updateProfileName(formData) {
    const fullName = getString(formData, "full_name");
    if (fullName.length > 100) {
        (0, navigation_1.redirect)("/dashboard?error=Profile+name+is+too+long.");
    }
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        (0, navigation_1.redirect)("/login");
    }
    const { error: authError } = await supabase.auth.updateUser({
        data: {
            full_name: fullName,
        },
    });
    if (authError) {
        (0, navigation_1.redirect)(`/dashboard?error=${encodeURIComponent("Server Error: Unable to update profile")}`);
    }
    const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", user.id);
    if (profileError) {
        (0, navigation_1.redirect)(`/dashboard?error=${encodeURIComponent("Server Error: Unable to update profile")}`);
    }
    (0, navigation_1.redirect)("/dashboard?success=Profile+updated.");
}
// sign in user through google
// TODO: fix the google auth process
async function signInWithGoogle(formData) {
    const nextPath = getNextPath(formData);
    // are we actually gonna display this to the user???
    // TODO: change it up a bit maybe??
    if (!(0, auth_providers_1.isGoogleAuthEnabled)()) {
        (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/login", {
            error: "Google sign-in is not enabled for this workspace. Use email and password instead.",
            next: nextPath !== "/dashboard" ? nextPath : null,
        }));
    }
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: getAuthCallbackUrl(nextPath),
        },
    });
    // again are we really gonna show this to the user??
    // TODO: change this message up a bit
    if (error) {
        const errorMessage = error.message
            .toLowerCase()
            .includes("provider is not enabled")
            ? "Google sign-in is not enabled for this workspace. Use email and password instead."
            : error.message;
        // TODO: what is this redirect aaaaah
        (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/login", {
            error: errorMessage,
            next: nextPath !== "/dashboard" ? nextPath : null,
        }));
    }
    if (data.url) {
        (0, navigation_1.redirect)(data.url);
    }
    (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/login", {
        error: "Google sign-in did not return a login URL. Please try again.",
        next: nextPath !== "/dashboard" ? nextPath : null,
    }));
}
async function requestPasswordReset(formData) {
    const email = getString(formData, "email").toLowerCase();
    if (!validateEmail(email)) {
        (0, navigation_1.redirect)("/forgot-password?error=Enter+a+valid+email+address.");
    }
    const cookieStore = await (0, headers_1.cookies)();
    const attemptsCookie = cookieStore.get("forgot_password_attempts")?.value;
    let attempts = attemptsCookie ? parseInt(attemptsCookie, 10) : 0;
    if (attempts >= 3) {
        (0, navigation_1.redirect)("/forgot-password?error=Too+many+requests.+Please+try+again+later.");
    }
    attempts += 1;
    cookieStore.set("forgot_password_attempts", attempts.toString(), { maxAge: 3600, path: '/' });
    const supabase = await (0, server_1.createSupabaseServerClient)();
    await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthCallbackUrl("/reset-password"),
    });
    const successMessage = "If an account with that email exists, we've sent a reset link.";
    (0, navigation_1.redirect)(`/forgot-password?success=${encodeURIComponent(successMessage)}`);
}
async function resetPassword(formData) {
    const password = getString(formData, "password");
    const confirmPassword = getString(formData, "confirm_password");
    if (password.length < 8) {
        (0, navigation_1.redirect)("/reset-password?error=Use+at+least+8+characters+for+your+password.");
    }
    if (password !== confirmPassword) {
        (0, navigation_1.redirect)("/reset-password?error=Passwords+do+not+match.");
    }
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        (0, navigation_1.redirect)(`/forgot-password?error=${encodeURIComponent((0, auth_errors_1.getEmailLinkErrorMessage)())}`);
    }
    const { error } = await supabase.auth.updateUser({
        password: password,
    });
    if (error) {
        (0, navigation_1.redirect)(`/forgot-password?error=${encodeURIComponent((0, auth_errors_1.getEmailLinkErrorMessage)(error.message))}`);
    }
    await supabase.auth.signOut();
    (0, navigation_1.redirect)("/login?success=Password+updated+successfully.+You+can+now+log+in.");
}
async function updateDigestSettings(formData) {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        (0, navigation_1.redirect)("/login");
    }
    const timezone = formData.get("timezone");
    const weekly_digest_enabled = formData.get("weekly_digest_enabled") === "true";
    const { error } = await supabase
        .from("profiles")
        .update({ timezone, weekly_digest_enabled })
        .eq("user_id", user.id);
    if (error) {
        (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/settings/general", { error: "Failed to update settings" }));
    }
    (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/settings/general", { success: "Settings updated" }));
}
async function updateProfileInfo(formData) {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        (0, navigation_1.redirect)("/login");
    }
    const first_name = formData.get("first_name") || "";
    const last_name = formData.get("last_name") || "";
    const company_name = formData.get("company_name") || null;
    const fullName = `${first_name} ${last_name}`.trim() || null;
    const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", user.id);
    if (profileError) {
        (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/settings/general", { error: "Failed to update profile details" }));
    }
    const { data: memberData } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();
    if (company_name && memberData?.organization_id) {
        const adminSupabase = (0, admin_1.createSupabaseAdminClient)();
        const { error: orgError } = await adminSupabase
            .from("organizations")
            .update({ name: company_name })
            .eq("id", memberData.organization_id);
        if (orgError) {
            (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/settings/general", { error: "Failed to update company name" }));
        }
    }
    (0, navigation_1.redirect)((0, paths_1.buildPathWithQuery)("/settings/general", { success: "Profile details updated" }));
}
