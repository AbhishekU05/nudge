import { NextResponse } from "next/server";

import {
  authorizationEndpoint,
  mcpBaseUrl,
  registrationEndpoint,
  tokenEndpoint,
} from "@/lib/mcp/config";

// OAuth 2.0 Authorization Server Metadata (RFC 8414). Served at
// /.well-known/oauth-authorization-server via a rewrite in next.config.ts.
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
} as const;

export function GET() {
  return NextResponse.json(
    {
      issuer: mcpBaseUrl(),
      authorization_endpoint: authorizationEndpoint(),
      token_endpoint: tokenEndpoint(),
      registration_endpoint: registrationEndpoint(),
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: ["read"],
    },
    { headers: CORS },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
