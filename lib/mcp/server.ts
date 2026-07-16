import "server-only";

import type { McpAuth } from "@/lib/mcp/auth";
import { MCP_PROTOCOL_VERSION, MCP_SERVER_NAME, MCP_SERVER_VERSION } from "@/lib/mcp/config";
import * as q from "@/lib/mcp/queries";

// Hand-rolled MCP over JSON-RPC 2.0 (Streamable HTTP, plain JSON responses — no
// SSE / no session state). The route validates the bearer token before calling
// in, so `auth` (and its organizationId) is always present here.
//
// Every tool returns pre-computed SIGNALS (risk scores, rates, trends, computed
// recommendations) — never raw invoice/payment rows. Claude reasons over the
// signals; it never does the arithmetic. All computation lives in Postgres RPCs.

type JsonRpcId = string | number | null;

type JsonRpcMessage = {
  jsonrpc?: unknown;
  id?: JsonRpcId;
  method?: unknown;
  params?: Record<string, unknown>;
};

type ToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: Record<string, unknown>;
  handler: (args: Record<string, unknown>, auth: McpAuth) => Promise<unknown>;
};

const readOnly = { readOnlyHint: true, openWorldHint: false, destructiveHint: false };

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

const TOOLS: ToolDef[] = [
  {
    name: "get_action_center",
    description:
      "Duely's prioritized collection actions, each with the pre-computed signals behind it (recommended_action, priority, amount_at_stake, days_overdue, client_risk_score, consecutive_missed_actions, avg_days_from_due, on_time_rate). Reason over these to explain or draft outreach — the recommendation and priority are already computed.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { ...readOnly, title: "Action center" },
    handler: (_args, auth) => q.getActionCenter(auth.organizationId),
  },
  {
    name: "get_client_risk_profile",
    description:
      "A processed risk profile for one client: risk_score (1-10), payment_reliability, trend, avg_days_from_due, avg_days_late, on_time_rate, consecutive_late_payments, partial_payment_count, totals and overdue counts. Use these signals to judge whether a client is risky or how to approach them — do not recompute from raw data.",
    inputSchema: {
      type: "object",
      properties: { client_name: { type: "string", description: "Client name (partial match)." } },
      required: ["client_name"],
      additionalProperties: false,
    },
    annotations: { ...readOnly, title: "Client risk profile" },
    handler: (args, auth) => q.getClientRiskProfile(auth.organizationId, String(args.client_name ?? "")),
  },
  {
    name: "get_ar_health",
    description:
      "Processed accounts-receivable health: health_score (1-10), collection_efficiency, avg_days_sales_outstanding (DSO), cash_at_risk, estimated_cash_inflow_next_30_days, high_risk_client_count, overdue/active counts, and month-over-month trend. Portfolio-level signals, already computed.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { ...readOnly, title: "AR health" },
    handler: (_args, auth) => q.getArHealth(auth.organizationId),
  },
  {
    name: "get_upcoming_activity",
    description:
      "What's coming due in the next `days` days (default 7), each row carrying the client's risk_score and on_time_rate as likelihood signals, plus whether reminders are scheduled and a late fee may apply.",
    inputSchema: {
      type: "object",
      properties: { days: { type: "number", minimum: 1, description: "Look-ahead window in days (default 7)." } },
      additionalProperties: false,
    },
    annotations: { ...readOnly, title: "Upcoming activity" },
    handler: (args, auth) => q.getUpcomingActivity(auth.organizationId, toNumber(args.days, 7)),
  },
  {
    name: "get_recent_activity",
    description:
      "A processed summary of the last `days` days (default 7): payments received with on-time flags, the period's on-time payment rate, reminders sent, and late fees applied (count + amount).",
    inputSchema: {
      type: "object",
      properties: { days: { type: "number", minimum: 1, description: "Look-back window in days (default 7)." } },
      additionalProperties: false,
    },
    annotations: { ...readOnly, title: "Recent activity" },
    handler: (args, auth) => q.getRecentActivity(auth.organizationId, toNumber(args.days, 7)),
  },
];

function ok(id: JsonRpcId, result: unknown) {
  return { jsonrpc: "2.0" as const, id, result };
}
function rpcError(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: "2.0" as const, id, error: { code, message } };
}

async function handleSingle(msg: JsonRpcMessage, auth: McpAuth) {
  const id: JsonRpcId = msg.id ?? null;
  const isNotification = msg.id === undefined;

  if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return isNotification ? null : rpcError(id, -32600, "Invalid Request");
  }

  const params = msg.params ?? {};

  switch (msg.method) {
    case "initialize": {
      const requested = params.protocolVersion;
      return ok(id, {
        protocolVersion: typeof requested === "string" ? requested : MCP_PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
      });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, {
        tools: TOOLS.map(({ name, description, inputSchema, annotations }) => ({
          name,
          description,
          inputSchema,
          annotations,
        })),
      });
    case "tools/call": {
      const name = params.name;
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${String(name)}`);
      try {
        const args = (params.arguments ?? {}) as Record<string, unknown>;
        const result = await tool.handler(args, auth);
        return ok(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
      } catch (e) {
        // MCP convention: tool failures are returned as an isError result, not a
        // protocol-level JSON-RPC error.
        const message = e instanceof Error ? e.message : String(e);
        return ok(id, { content: [{ type: "text", text: `Error: ${message}` }], isError: true });
      }
    }
    default:
      // Unknown notifications (e.g. notifications/initialized) are silently accepted.
      return isNotification ? null : rpcError(id, -32601, `Method not found: ${msg.method}`);
  }
}

// Returns the JSON-RPC response(s), or null when the payload was only
// notifications (the route then replies 202 with no body).
export async function handleMcpMessage(body: unknown, auth: McpAuth) {
  if (Array.isArray(body)) {
    const responses = (await Promise.all(body.map((m) => handleSingle(m as JsonRpcMessage, auth)))).filter(
      (r) => r !== null,
    );
    return responses.length > 0 ? responses : null;
  }
  return handleSingle((body ?? {}) as JsonRpcMessage, auth);
}
