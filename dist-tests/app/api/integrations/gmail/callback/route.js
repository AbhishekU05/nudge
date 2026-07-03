"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = exports.runtime = void 0;
exports.GET = GET;
const headers_1 = require("next/headers");
const server_1 = require("next/server");
const env_1 = require("@/lib/env");
const reminder_1 = require("@/lib/email/reminder");
const admin_1 = require("@/lib/supabase/admin");
const server_2 = require("@/lib/supabase/server");
const logger_1 = require("@/lib/logger");
exports.runtime = "nodejs";
exports.dynamic = "force-dynamic";
function redirectToSettings(key, message) {
    const url = new URL("/settings/integrations", (0, reminder_1.getAppUrl)());
    url.searchParams.set(key, message);
    return server_1.NextResponse.redirect(url);
}
async function GET(request) {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const errorParam = request.nextUrl.searchParams.get("error");
    if (errorParam) {
        logger_1.logger.external({
            service: "Gmail",
            action: "oauth_callback",
            success: false,
            error: errorParam,
        });
        return redirectToSettings("error", `Gmail authorization failed: ${errorParam}`);
    }
    if (!code || !state) {
        return redirectToSettings("error", "Gmail did not return all required parameters.");
    }
    // Verify the logged-in user and state token
    const supabase = await (0, server_2.createSupabaseServerClient)();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        const url = new URL("/login", (0, reminder_1.getAppUrl)());
        url.searchParams.set("next", "/settings/integrations");
        return server_1.NextResponse.redirect(url);
    }
    const adminSupabase = (0, admin_1.createSupabaseAdminClient)();
    // Verify CSRF state
    const cookieStore = await (0, headers_1.cookies)();
    const savedState = cookieStore.get("gmail_oauth_state")?.value;
    if (!savedState || savedState !== state) {
        return redirectToSettings("error", "Invalid Gmail OAuth state. Please try again.");
    }
    // Clear the state token immediately
    cookieStore.delete("gmail_oauth_state");
    try {
        const clientId = (0, env_1.getRequiredEnv)("GOOGLE_CLIENT_ID");
        const clientSecret = (0, env_1.getRequiredEnv)("GOOGLE_CLIENT_SECRET");
        const appUrl = (0, reminder_1.getAppUrl)();
        const redirectUri = `${appUrl}/api/integrations/gmail/callback`;
        // Exchange the authorization code for tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: "authorization_code",
                redirect_uri: redirectUri,
            }),
        });
        if (!tokenRes.ok) {
            const text = await tokenRes.text();
            throw new Error(`Google token exchange failed (${tokenRes.status}): ${text}`);
        }
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;
        if (!accessToken) {
            throw new Error("Google did not return an access token.");
        }
        // Fetch the Gmail address associated with this Google account
        const profileRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", { headers: { Authorization: `Bearer ${accessToken}` } });
        const gmailEmail = profileRes.ok
            ? (await profileRes.json()).emailAddress ?? null
            : null;
        // Store tokens in the profiles table
        const tokenUpdate = {
            google_access_token: accessToken,
            gmail_connected_email: gmailEmail,
        };
        if (refreshToken) {
            tokenUpdate.google_refresh_token = refreshToken;
        }
        await adminSupabase
            .from("profiles")
            .update(tokenUpdate)
            .eq("user_id", user.id);
        logger_1.logger.external({
            service: "Gmail",
            action: "oauth_callback",
            success: true,
        });
        return redirectToSettings("success", "Gmail connected successfully.");
    }
    catch (error) {
        logger_1.logger.external({
            service: "Gmail",
            action: "oauth_callback",
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return redirectToSettings("error", error instanceof Error ? error.message : "Failed to connect Gmail.");
    }
}
