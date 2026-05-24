import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequiredEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Gmail API email sender.
 *
 * Sends plain-text emails from the user's own Gmail account using
 * the access token obtained during Google OAuth login. Handles
 * automatic token refresh via the stored refresh token.
 */

type GoogleTokenRow = {
  google_access_token: string | null;
  google_refresh_token: string | null;
};

type SendGmailParams = {
  userId: string;
  senderName: string;
  senderEmail: string;
  to: string;
  subject: string;
  body: string;
};

// ── Token management ──────────────────────────────────────────

async function getGoogleTokens(userId: string): Promise<GoogleTokenRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("google_access_token, google_refresh_token")
    .eq("user_id", userId)
    .maybeSingle<GoogleTokenRow>();

  if (error || !data) return null;
  return data;
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET");

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

async function persistAccessToken(userId: string, accessToken: string) {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("profiles")
    .update({ google_access_token: accessToken })
    .eq("user_id", userId);
}

// ── Gmail API send ────────────────────────────────────────────

function buildRfc2822Message(params: {
  from: string;
  to: string;
  subject: string;
  body: string;
}): string {
  const lines = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    params.body,
  ];
  return lines.join("\r\n");
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendViaGmailApi(
  accessToken: string,
  rawMessage: string,
): Promise<{ id: string; threadId: string }> {
  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: base64UrlEncode(rawMessage) }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API send failed (${res.status}): ${text}`);
  }

  return res.json();
}

// ── Public entry point ────────────────────────────────────────

export async function sendGmail(params: SendGmailParams): Promise<void> {
  const startTime = Date.now();

  const tokens = await getGoogleTokens(params.userId);
  if (!tokens?.google_access_token && !tokens?.google_refresh_token) {
    throw new Error(
      "No Google tokens found for this user. They need to re-authenticate with Google.",
    );
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
  });

  // Try sending with the current access token
  if (accessToken) {
    try {
      await sendViaGmailApi(accessToken, rawMessage);
      logger.external({
        service: "Gmail",
        action: "send_email",
        success: true,
        latency: Date.now() - startTime,
      });
      return;
    } catch (error) {
      // If 401, token is expired — fall through to refresh
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("401")) {
        logger.external({
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
    throw new Error(
      "Google access token expired and no refresh token available. User needs to re-authenticate.",
    );
  }

  const refreshed = await refreshAccessToken(tokens.google_refresh_token);
  accessToken = refreshed.access_token;

  // Persist the new access token for next time
  await persistAccessToken(params.userId, accessToken);

  // Retry send with the fresh token
  await sendViaGmailApi(accessToken, rawMessage);

  logger.external({
    service: "Gmail",
    action: "send_email",
    success: true,
    latency: Date.now() - startTime,
  });
}
