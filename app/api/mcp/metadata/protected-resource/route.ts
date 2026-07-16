import { NextResponse } from "next/server";

import { mcpBaseUrl, mcpResourceUrl } from "@/lib/mcp/config";

// OAuth 2.0 Protected Resource Metadata (RFC 9728). Served at
// /.well-known/oauth-protected-resource (and its path-suffixed form) via
// rewrites in next.config.ts. Points Claude at this app as the auth server.
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
} as const;

export function GET() {
  return NextResponse.json(
    {
      resource: mcpResourceUrl(),
      authorization_servers: [mcpBaseUrl()],
      scopes_supported: ["read"],
      bearer_methods_supported: ["header"],
    },
    { headers: CORS },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
