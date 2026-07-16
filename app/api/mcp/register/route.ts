import { NextResponse } from "next/server";
import crypto from "crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Dynamic Client Registration (RFC 7591). Claude POSTs its client metadata
// (including redirect_uris) and we return a generated client_id. Public client:
// no secret is issued — security rests on PKCE at the authorize/token steps.
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
} as const;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400, headers: CORS });
  }

  const redirectUris = Array.isArray(body.redirect_uris)
    ? (body.redirect_uris.filter((u) => typeof u === "string") as string[])
    : [];
  if (redirectUris.length === 0) {
    return NextResponse.json(
      { error: "invalid_redirect_uri", error_description: "redirect_uris is required" },
      { status: 400, headers: CORS },
    );
  }

  const clientId = `mcp_${crypto.randomBytes(16).toString("hex")}`;
  const clientName = typeof body.client_name === "string" ? body.client_name : "MCP Client";

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("mcp_oauth_clients").insert({
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
  });
  if (error) {
    return NextResponse.json({ error: "server_error" }, { status: 500, headers: CORS });
  }

  return NextResponse.json(
    {
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
    { status: 201, headers: CORS },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
