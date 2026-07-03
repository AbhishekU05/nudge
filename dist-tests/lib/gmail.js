"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleTokens = getGoogleTokens;
exports.hasGmailTokens = hasGmailTokens;
exports.sendGmail = sendGmail;
require("server-only");
const admin_1 = require("@/lib/supabase/admin");
const env_1 = require("@/lib/env");
const logger_1 = require("@/lib/logger");
// ── Token management ──────────────────────────────────────────
async function getGoogleTokens(userId) {
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    const { data, error } = await supabase
        .from("profiles")
        .select("google_access_token, google_refresh_token")
        .eq("user_id", userId)
        .maybeSingle();
    if (error || !data)
        return null;
    return data;
}
/**
 * Quick check whether a user has Gmail tokens stored.
 * Used by the sending logic to decide Gmail vs Resend fallback.
 */
async function hasGmailTokens(userId) {
    const tokens = await getGoogleTokens(userId);
    return Boolean(tokens?.google_access_token || tokens?.google_refresh_token);
}
async function refreshAccessToken(refreshToken) {
    const clientId = (0, env_1.getRequiredEnv)("GOOGLE_CLIENT_ID");
    const clientSecret = (0, env_1.getRequiredEnv)("GOOGLE_CLIENT_SECRET");
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Google token refresh failed (${res.status}): ${text}`);
    }
    return res.json();
}
async function persistAccessToken(userId, accessToken) {
    const supabase = (0, admin_1.createSupabaseAdminClient)();
    await supabase
        .from("profiles")
        .update({ google_access_token: accessToken })
        .eq("user_id", userId);
}
// ── Gmail API send ────────────────────────────────────────────
function buildRfc2822Message(params) {
    const lines = [
        `From: ${params.from}`,
        `To: ${params.to}`,
        `Subject: ${params.subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: ${params.html ? "text/html" : "text/plain"}; charset=UTF-8`,
        ``,
        params.body,
    ];
    return lines.join("\r\n");
}
function base64UrlEncode(str) {
    return Buffer.from(str)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}
async function sendViaGmailApi(accessToken, rawMessage) {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: base64UrlEncode(rawMessage) }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Gmail API send failed (${res.status}): ${text}`);
    }
    return res.json();
}
// ── Public entry point ────────────────────────────────────────
async function sendGmail(params) {
    const startTime = Date.now();
    const tokens = await getGoogleTokens(params.userId);
    if (!tokens?.google_access_token && !tokens?.google_refresh_token) {
        throw new Error("No Google tokens found for this user. They need to re-authenticate with Google.");
    }
    let accessToken = tokens.google_access_token;
    // Build the raw RFC 2822 message
    const fromHeader = params.senderName
        ? `${params.senderName} <${params.senderEmail}>`
        : params.senderEmail;
    const rawMessage = buildRfc2822Message({
        from: fromHeader,
        to: params.to,
        subject: params.subject,
        body: params.body,
        html: params.html,
    });
    // Try sending with the current access token
    if (accessToken) {
        try {
            await sendViaGmailApi(accessToken, rawMessage);
            logger_1.logger.external({
                service: "Gmail",
                action: "send_email",
                success: true,
                latency: Date.now() - startTime,
            });
            return;
        }
        catch (error) {
            // If 401, token is expired — fall through to refresh
            const message = error instanceof Error ? error.message : "";
            if (!message.includes("401")) {
                logger_1.logger.external({
                    service: "Gmail",
                    action: "send_email",
                    success: false,
                    latency: Date.now() - startTime,
                    error: message,
                });
                throw error;
            }
        }
    }
    // Refresh the access token
    if (!tokens.google_refresh_token) {
        throw new Error("Google access token expired and no refresh token available. User needs to re-authenticate.");
    }
    const refreshed = await refreshAccessToken(tokens.google_refresh_token);
    accessToken = refreshed.access_token;
    // Persist the new access token for next time
    await persistAccessToken(params.userId, accessToken);
    // Retry send with the fresh token
    await sendViaGmailApi(accessToken, rawMessage);
    logger_1.logger.external({
        service: "Gmail",
        action: "send_email",
        success: true,
        latency: Date.now() - startTime,
    });
}
