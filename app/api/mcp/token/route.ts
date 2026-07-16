import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateOpaqueToken, sha256Hex, verifyPkceS256 } from "@/lib/mcp/auth";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from "@/lib/mcp/config";

// OAuth 2.1 token endpoint: authorization_code (with PKCE) and refresh_token.
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
} as const;

type Admin = ReturnType<typeof createSupabaseAdminClient>;

function tokenError(error: string, description?: string, status = 400) {
  return NextResponse.json(
    { error, ...(description ? { error_description: description } : {}) },
    { status, headers: CORS },
  );
}

async function readParams(req: Request): Promise<URLSearchParams> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      if (value != null) params.set(key, String(value));
    }
    return params;
  }
  return new URLSearchParams(await req.text());
}

async function issueTokens(
  supabase: Admin,
  args: { userId: string; organizationId: string; clientId: string | null; scope: string },
) {
  const accessToken = generateOpaqueToken();
  const refreshToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000);
  // Idle expiry; each refresh slides it forward (see handleRefreshToken).
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

  const { error } = await supabase.from("mcp_tokens").insert({
    token: sha256Hex(accessToken),
    refresh_token: sha256Hex(refreshToken),
    user_id: args.userId,
    organization_id: args.organizationId,
    client_id: args.clientId,
    scope: args.scope,
    expires_at: expiresAt.toISOString(),
    refresh_expires_at: refreshExpiresAt.toISOString(),
  });
  if (error) return tokenError("server_error", undefined, 500);

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      refresh_token: refreshToken,
      scope: args.scope,
    },
    { headers: { ...CORS, "Cache-Control": "no-store" } },
  );
}

async function handleAuthorizationCode(supabase: Admin, params: URLSearchParams) {
  const code = params.get("code");
  const codeVerifier = params.get("code_verifier");
  const redirectUri = params.get("redirect_uri");
  const clientId = params.get("client_id");
  if (!code || !codeVerifier || !redirectUri) return tokenError("invalid_request");

  const { data: row } = await supabase
    .from("mcp_auth_codes")
    .select("user_id, organization_id, client_id, redirect_uri, code_challenge, scope, used, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (!row || row.used || new Date(row.expires_at).getTime() <= Date.now()) {
    return tokenError("invalid_grant", "Authorization code is invalid or expired");
  }
  if (row.redirect_uri !== redirectUri) return tokenError("invalid_grant", "redirect_uri mismatch");
  if (clientId && row.client_id !== clientId) return tokenError("invalid_client");
  if (!verifyPkceS256(codeVerifier, row.code_challenge)) {
    return tokenError("invalid_grant", "PKCE verification failed");
  }

  // Atomically claim the code (single use) — guards against replay.
  const { data: claimed } = await supabase
    .from("mcp_auth_codes")
    .update({ used: true })
    .eq("code", code)
    .eq("used", false)
    .select("code")
    .maybeSingle();
  if (!claimed) return tokenError("invalid_grant", "Authorization code already used");

  return issueTokens(supabase, {
    userId: row.user_id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    scope: row.scope,
  });
}

async function handleRefreshToken(supabase: Admin, params: URLSearchParams) {
  const refreshToken = params.get("refresh_token");
  if (!refreshToken) return tokenError("invalid_request");

  const { data: row } = await supabase
    .from("mcp_tokens")
    .select("id, user_id, organization_id, client_id, scope, refresh_expires_at")
    .eq("refresh_token", sha256Hex(refreshToken))
    .maybeSingle();
  if (!row) return tokenError("invalid_grant", "Unknown refresh token");
  // Absolute expiry: rotation issues a new refresh token but never extends this,
  // so a connection can't live past REFRESH_TOKEN_TTL_SECONDS without re-consent.
  // Sliding window: the refresh token lapses only after REFRESH_TOKEN_TTL_SECONDS
  // of inactivity; an actually-used connection never expires.
  if (row.refresh_expires_at && new Date(row.refresh_expires_at).getTime() <= Date.now()) {
    return tokenError("invalid_grant", "Refresh token expired; reconnect required");
  }

  // Rotate: mint a fresh access + refresh token, replace the row's hashes, and
  // slide both expiries forward.
  const accessToken = generateOpaqueToken();
  const newRefreshToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
  const { error } = await supabase
    .from("mcp_tokens")
    .update({
      token: sha256Hex(accessToken),
      refresh_token: sha256Hex(newRefreshToken),
      expires_at: expiresAt.toISOString(),
      refresh_expires_at: refreshExpiresAt.toISOString(),
    })
    .eq("id", row.id);
  if (error) return tokenError("server_error", undefined, 500);

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      refresh_token: newRefreshToken,
      scope: row.scope,
    },
    { headers: { ...CORS, "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const params = await readParams(req);
  const grantType = params.get("grant_type");
  const supabase = createSupabaseAdminClient();

  if (grantType === "authorization_code") return handleAuthorizationCode(supabase, params);
  if (grantType === "refresh_token") return handleRefreshToken(supabase, params);
  return tokenError("unsupported_grant_type");
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
