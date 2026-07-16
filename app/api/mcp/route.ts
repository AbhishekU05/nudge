import { NextResponse } from "next/server";

import { validateBearer } from "@/lib/mcp/auth";
import { protectedResourceMetadataUrl } from "@/lib/mcp/config";
import { handleMcpMessage } from "@/lib/mcp/server";

// Streamable HTTP MCP endpoint. Stateless: each POST carries a bearer token and
// a JSON-RPC message; we reply with plain application/json (no SSE).
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-protocol-version",
} as const;

function unauthorized() {
  // The WWW-Authenticate header points Claude at the protected-resource metadata,
  // kicking off the OAuth discovery + Dynamic Client Registration flow.
  return new NextResponse(JSON.stringify({ error: "invalid_token" }), {
    status: 401,
    headers: {
      ...CORS,
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer resource_metadata="${protectedResourceMetadataUrl()}"`,
    },
  });
}

export async function POST(req: Request) {
  const auth = await validateBearer(req.headers.get("authorization"));
  if (!auth) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400, headers: CORS },
    );
  }

  const result = await handleMcpMessage(body, auth);
  if (result === null) {
    // Notification(s) only — no response body.
    return new NextResponse(null, { status: 202, headers: CORS });
  }
  return NextResponse.json(result, { headers: CORS });
}

// We don't push server-initiated messages, so there's no SSE stream to open.
export async function GET() {
  return new NextResponse(JSON.stringify({ error: "method_not_allowed" }), {
    status: 405,
    headers: { ...CORS, "Content-Type": "application/json", Allow: "POST" },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
