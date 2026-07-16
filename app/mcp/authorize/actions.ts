"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateOpaqueToken } from "@/lib/mcp/auth";
import { AUTH_CODE_TTL_SECONDS, CLAUDE_REDIRECT_URI, MCP_SCOPE } from "@/lib/mcp/config";

function withParams(uri: string, params: Record<string, string | undefined>): string {
  const url = new URL(uri);
  for (const [key, value] of Object.entries(params)) {
    if (value != null) url.searchParams.set(key, value);
  }
  return url.toString();
}

// Consent decision handler. Issues a single-use PKCE authorization code bound to
// the logged-in user's org, then redirects back to Claude's callback. Every
// input is re-validated here — hidden form fields are never trusted on their own.
export async function approveMcpAuthorization(formData: FormData): Promise<void> {
  const user = await requireUser();

  const decision = String(formData.get("decision") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  const redirectUri = String(formData.get("redirect_uri") ?? "");
  const codeChallenge = String(formData.get("code_challenge") ?? "");
  const stateRaw = formData.get("state");
  const state = stateRaw ? String(stateRaw) : undefined;
  const scope = String(formData.get("scope") ?? MCP_SCOPE) || MCP_SCOPE;

  const supabase = createSupabaseAdminClient();
  const { data: client } = await supabase
    .from("mcp_oauth_clients")
    .select("redirect_uris")
    .eq("client_id", clientId)
    .maybeSingle();

  const validRequest =
    !!client &&
    Array.isArray(client.redirect_uris) &&
    client.redirect_uris.includes(redirectUri) &&
    redirectUri === CLAUDE_REDIRECT_URI &&
    codeChallenge.length > 0;

  // With an untrusted/invalid redirect_uri we must not redirect to it.
  if (!validRequest) redirect("/settings/integrations?error=invalid_request");

  if (decision !== "approve") {
    redirect(withParams(redirectUri, { error: "access_denied", state }));
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const organizationId = member?.organization_id;
  if (!organizationId) {
    redirect(withParams(redirectUri, { error: "access_denied", error_description: "No organization", state }));
  }

  const code = generateOpaqueToken();
  const { error } = await supabase.from("mcp_auth_codes").insert({
    code,
    user_id: user.id,
    organization_id: organizationId,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    scope,
    expires_at: new Date(Date.now() + AUTH_CODE_TTL_SECONDS * 1000).toISOString(),
  });
  if (error) {
    redirect(withParams(redirectUri, { error: "server_error", state }));
  }

  redirect(withParams(redirectUri, { code, state }));
}
