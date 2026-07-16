import "server-only";

import crypto from "crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Tokens and codes are opaque random strings; only their SHA-256 hashes are
// stored, so a database leak never exposes usable bearer credentials.
export function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

// PKCE S256: the presented verifier must hash to the stored challenge.
export function verifyPkceS256(codeVerifier: string, codeChallenge: string): boolean {
  const computed = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  const a = Buffer.from(computed);
  const b = Buffer.from(codeChallenge);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export type McpAuth = {
  userId: string;
  organizationId: string;
  scope: string;
};

// Validate an incoming `Authorization: Bearer <token>` header and resolve it to
// its org. Uses the admin client (token bookkeeping) — never the read-only role.
// Returns null for anything missing, unknown, or expired.
export async function validateBearer(authHeader: string | null): Promise<McpAuth | null> {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  if (!match) return null;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("mcp_tokens")
    .select("user_id, organization_id, scope, expires_at")
    .eq("token", sha256Hex(match[1]))
    .maybeSingle();

  if (!data) return null;
  if (new Date(data.expires_at).getTime() <= Date.now()) return null;

  return {
    userId: data.user_id,
    organizationId: data.organization_id,
    scope: data.scope,
  };
}
