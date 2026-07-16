# MCP Server (Model Context Protocol) in Duely

A **read-only** MCP server that lets users query their accounts-receivable (AR) data
from Claude. It lives inside the existing Next.js 16 app — there is no separate service.
Claude connects over OAuth 2.1; the issued token maps to one `organization_id`, and every
tool returns only that org's data. **No mutation tools exist** — no creating invoices,
logging payments, applying late fees, or sending reminders.

- **Endpoint:** `POST https://duely.in/api/mcp`
- **Transport:** Streamable HTTP (hand-rolled JSON-RPC 2.0, plain `application/json`, no SSE)
- **Auth:** OAuth 2.1 + PKCE (S256) + Dynamic Client Registration, all served in-app
- **Data access:** a SELECT-only Postgres role behind `SECURITY DEFINER` RPCs — read-only
  and cross-tenant isolation are both enforced by the **database**, not just app code
- **No extra secrets:** uses the service role already in the environment; no JWT secret

---

## 1. High-level flow

```mermaid
sequenceDiagram
    participant C as Claude
    participant M as /api/mcp
    participant W as /.well-known/*
    participant A as /mcp/authorize (page)
    participant T as /api/mcp/token
    participant DB as Supabase

    C->>M: POST (no token)
    M-->>C: 401 + WWW-Authenticate: resource_metadata=...
    C->>W: GET protected-resource + authorization-server metadata
    C->>M: POST /api/mcp/register (Dynamic Client Registration)
    M-->>C: { client_id }
    C->>A: redirect user (client_id, redirect_uri, code_challenge, state)
    A->>A: require Duely login; validate client + redirect_uri
    A->>DB: on approve → insert single-use PKCE auth code (org from membership)
    A-->>C: redirect to claude.ai callback (?code, &state)
    C->>T: POST grant_type=authorization_code (code + code_verifier)
    T->>DB: verify PKCE, claim code, insert hashed access+refresh tokens
    T-->>C: { access_token, refresh_token, expires_in }
    C->>M: POST tools/call (Authorization: Bearer <token>)
    M->>DB: validate token → org → SECURITY DEFINER RPC (RLS-scoped)
    M-->>C: JSON-RPC result (only this org's data)
```

---

## 2. Authentication & authorization

### OAuth 2.1 Authorization Server (built in-app)

Claude's custom connector requires a full AS, not just "log in and hand back a token."
We implement the minimum: discovery metadata, Dynamic Client Registration, PKCE, an
authorization (consent) endpoint, and a token endpoint.

| Concern             | How                                                                              |
| ------------------- | -------------------------------------------------------------------------------- |
| Discovery           | RFC 9728 (protected resource) + RFC 8414 (authorization server) metadata         |
| Client registration | RFC 7591 Dynamic Client Registration; public client (no secret), PKCE only       |
| Proof of possession | PKCE **S256 required** (`code_challenge_method=S256`)                            |
| Auth codes          | opaque, **single-use**, **5-minute** TTL, bound to `code_challenge`              |
| Access tokens       | opaque, **1-hour** TTL, refreshable                                              |
| Refresh tokens      | opaque, rotated on each use, **90-day idle** expiry (each use slides it forward) |
| Redirect URI        | strictly allowlisted to `https://claude.ai/api/mcp/auth_callback`                |
| Token at rest       | **SHA-256 hashes only** — plaintext bearers are never stored                     |

### The org binding (the crux of tenant safety)

The `organization_id` is **bound to the token at issue time** and only ever comes from the
server:

1. At consent, the user is authenticated via their **Duely session cookie** (`getUser()`).
2. Their org is read from `organization_members` (one org per user).
3. That org id is written into the auth code → the access token row.
4. On every tool call it is read **back out of the token**, never taken from tool input.

No MCP tool accepts an organization id (see the schemas in `lib/mcp/server.ts` — inputs are
only `client_name`, `days_overdue`, `days`). So a hallucinated or malformed tool call is
still bounded to the token's org.

---

## 3. OAuth endpoints

| Route                                         | Purpose                                                                                                                                                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /.well-known/oauth-protected-resource`   | RFC 9728 metadata → points Claude at this app as the AS. Also handles the path-suffixed form `/.well-known/oauth-protected-resource/api/mcp`.                                                  |
| `GET /.well-known/oauth-authorization-server` | RFC 8414 metadata: authorize/token/register endpoints, `S256`, `read` scope.                                                                                                                   |
| `POST /api/mcp/register`                      | Dynamic Client Registration → generates a `client_id`, stores `redirect_uris`.                                                                                                                 |
| `GET /mcp/authorize` (a page)                 | Consent screen. Requires Duely login (else `redirect("/login?next=…")` preserving the request). Validates `client_id` + `redirect_uri`. On approve, `approveMcpAuthorization` issues the code. |
| `POST /api/mcp/token`                         | `authorization_code` (verifies PKCE, single-use) and `refresh_token` (rotates).                                                                                                                |

The `.well-known` URLs are served by route handlers under `app/api/mcp/metadata/*` and mapped
via **rewrites in `next.config.ts`** (avoids relying on literal dotfolder routes in this
customized Next 16 build).

---

## 4. Token storage

Migration: `supabase/migrations/20260715030000_mcp_oauth.sql`. Three tables, RLS enabled with
**no public policies** — only the service role (which bypasses RLS) touches them.

| Table               | Columns (essentials)                                                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mcp_oauth_clients` | `client_id` PK, `client_name`, `redirect_uris[]`                                                                                                                                          |
| `mcp_auth_codes`    | `code` PK, `user_id`, `organization_id`, `client_id`, `redirect_uri`, `code_challenge`, `used`, `expires_at`                                                                              |
| `mcp_tokens`        | `id`, `token` (SHA-256 hash, UNIQUE), `user_id`, `organization_id`, `client_id`, `refresh_token` (hash, UNIQUE), `scope`, `expires_at` (access), `refresh_expires_at` (sliding, 90d idle) |

Multi-user orgs: each user gets their **own** token (their own `mcp_tokens` row), but all rows
for one org resolve to the **same** org's data.

---

## 5. Transport & tools

### Transport

Hand-rolled JSON-RPC 2.0 in `app/api/mcp/route.ts` + `lib/mcp/server.ts`. Stateless: every
POST carries a bearer token and one message; we reply with plain `application/json`. No SSE and
no session store (there are no server-initiated messages). Methods handled: `initialize`,
`notifications/initialized`, `tools/list`, `tools/call`, `ping`. A missing/invalid token →
`401` + `WWW-Authenticate` (which triggers Claude's OAuth discovery).

### Design philosophy: signals, not raw data

Every tool returns **pre-computed signals and statistics** — risk scores, rates, trends, and
Duely's own action recommendations — **not raw rows**. Duely does the deterministic processing
(in Postgres); Claude is a reasoning layer that explains, recommends, and summarizes over those
signals. The test: if Claude can answer a useful question **without doing arithmetic, counting
rows, or deriving insights from raw numbers**, the tool is designed right. Because the logic
lives in SQL (the `mcp_client_signals` view + RPCs), improving it benefits every consumer.

Claude generates the reasoning ("why is this client risky", "what to say", "should I take this
project"); Duely never writes explanations.

### The 5 tools (all `readOnlyHint: true`, all org-scoped)

| Tool                      | Args                | Returns (signals only)                                                                                                                                                                                                                   |
| ------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_action_center`       | —                   | Duely's prioritized actions: `recommended_action` (send_reminder/apply_late_fee/escalate/follow_up), `priority`, `amount_at_stake`, `days_overdue`, `client_risk_score`, `consecutive_missed_actions`, `avg_days_from_due`, `on_time_rate` |
| `get_client_risk_profile` | `client_name`       | `risk_score` (1-10), `payment_reliability`, `trend`, `avg_days_from_due`, `avg_days_late`, `on_time_rate`, `consecutive_late_payments`, `partial_payment_count`, totals, overdue counts, `oldest_overdue_days`                             |
| `get_ar_health`           | —                   | `health_score` (1-10), `collection_efficiency`, `avg_days_sales_outstanding` (DSO), `cash_at_risk`, `estimated_cash_inflow_next_30_days`, `high_risk_client_count`, overdue/active counts, `trend`                                       |
| `get_upcoming_activity`   | `days?` (default 7) | invoices coming due with `client_risk_score` + `on_time_rate` likelihood signals, `reminders_enabled`, `next_reminder_at`, `late_fee_may_apply`                                                                                          |
| `get_recent_activity`     | `days?` (default 7) | payments received with on-time flags, period `payments_on_time_rate`, `reminders_sent`, `late_fees_applied` (count + amount)                                                                                                             |

### The engine: `mcp_client_signals` view

The per-client deterministic logic is defined **once** in the `mcp_client_signals`
`security_invoker` view (so reads re-apply the `mcp_readonly` RLS). It computes, per client:
`risk_score`, `payment_reliability`, `trend`, `avg_days_from_due`, `avg_days_late`,
`on_time_rate`, `consecutive_late_payments`, `partial_payment_count`, `followup_count`,
outstanding/overdue totals, and `oldest_overdue_days`. The RPCs read from it.

**Risk score (1-10, weighted, in SQL):** overdue severity (up to 4) + payment unreliability
`(1 − on_time_rate)` (up to 3) + trailing late-payment streak (up to 2) + trend nudge
(`+1.5` worsening / `−1.0` improving), clamped to 1-10. `payment_reliability` buckets from the
score. Tuned in one place; every consumer benefits.

**Not computed (no backing data):** promise kept/broken stats. Duely has no structured promise
tracking (no promised-date/outcome columns — the UI action engine's promise branch references
columns that don't exist), so those signals are **omitted** rather than fabricated; they need a
promise-tracking feature first. `avg_days_from_due` is the signed average of `payment_date −
due_date` (positive = late, negative = early), off the reliable Xero-populated `due_date`.

Tool results are returned as a JSON string in a `content: [{ type: "text", text }]` block.
Tool-level failures are returned as `isError: true` results (per MCP), not JSON-RPC errors.

---

## 6. Data access & security model (no JWT)

All AR reads go through **`SECURITY DEFINER` Postgres functions owned by a SELECT-only role**,
called from the app via the **existing service-role client**. There are no JWTs and no extra
secret.

```
lib/mcp/queries.ts ──(service role .rpc)──▶ mcp_get_*() SECURITY DEFINER, owned by mcp_readonly
                                              │  set_config('app.current_org', p_org)   ← RLS input
                                              │  SELECT explicit columns …
                                              ▼
                                   RLS on invoices/payments/clients/events/applied_late_fees
                                   USING (organization_id = mcp_current_org())
```

Why this shape:

- **Read-only — DB-enforced.** Inside a `SECURITY DEFINER` function the effective role is the
  owner, `mcp_readonly`, which has **only `SELECT` grants**. Any write statement fails at the
  database. (The caller is `service_role`, but its RLS-bypass does **not** carry into a definer
  function.)
- **Cross-tenant — DB-enforced.** Each function pins `app.current_org` from its `p_org`
  parameter; the RLS policies scope every base table to `organization_id = mcp_current_org()`.
  Even if a query forgot its filter, Postgres returns **zero rows** outside that org. Deny by
  default: no GUC → `mcp_current_org()` is `NULL` → nothing matches.
- **Not callable by anyone else.** `EXECUTE` on each function is **revoked from `PUBLIC` and
  granted only to `service_role`**, so anon/authenticated users can't invoke them with an
  arbitrary `p_org`.
- **Signals computed in SQL.** Risk scores, rates, trends, and aggregates are all computed in
  the `mcp_client_signals` view + RPCs — never fetch-and-derive in TypeScript or Claude. No
  `SELECT *` reaches a tool; explicit columns only.
- `mcp_client_signals` is `security_invoker = true`, so reading it inside the definer functions
  re-applies these base-table policies as `mcp_readonly`. It computes balances directly from
  `invoices`+`payments` (it does not use the retired `invoice_balances` view).

### RPC functions (in the migration)

The engine view `mcp_client_signals` (per-client signals) plus five signal RPCs:
`mcp_get_action_center`, `mcp_get_client_risk_profile`, `mcp_get_ar_health`,
`mcp_get_upcoming_activity`, `mcp_get_recent_activity`. Each takes `p_org uuid` (+ tool args)
and is `STABLE SECURITY DEFINER SET search_path = public`, owned by `mcp_readonly`, `EXECUTE`
granted only to `service_role`.

### Threat model summary

| Threat                          | Mitigation                                                                 |
| ------------------------------- | -------------------------------------------------------------------------- |
| Claude reads another org's data | Org comes from the token only; RLS hard-scopes rows to it                  |
| Claude "hallucinates" a filter  | No org/raw-filter tool input; queries are parameterized (no SQL injection) |
| Any write via the connector     | `mcp_readonly` has no write grants; no mutation tools exist                |
| Token DB leak                   | Tokens/refresh tokens stored as SHA-256 hashes                             |
| Auth-code replay                | Single-use + 5-min TTL + atomic claim                                      |
| Open redirect                   | `redirect_uri` allowlisted to Claude's callback, re-validated server-side  |
| Arbitrary caller of the RPCs    | `EXECUTE` limited to `service_role`                                        |

---

## 7. Connect flow (UI)

`app/(app)/settings/integrations/page.tsx` renders a **Claude** card (alongside Gmail/Xero/
QuickBooks) with a **Connect to Claude** button. It opens Claude's connector modal pre-filled:

```
https://claude.ai/settings/connectors?modal=add-custom-connector&mcpName=Duely&mcpServerUrl=https://duely.in/api/mcp
```

The card also lists the user's active connections and offers **Disconnect**
(`app/actions/mcp.ts` → deletes the user's `mcp_tokens` rows, scoped to their `user_id`). The
card sits inside the page's existing subscription gate.

---

## 8. File map

```
supabase/migrations/20260715030000_mcp_oauth.sql   Tables, mcp_readonly role, RLS, mcp_client_signals view + signal RPCs
lib/mcp/config.ts                                  Base URLs, CLAUDE_REDIRECT_URI, TTLs, protocol version
lib/mcp/auth.ts                                    validateBearer, SHA-256 hashing, PKCE S256, token gen
lib/mcp/queries.ts                                 The 5 signal tools' functions (call the RPCs)
lib/mcp/server.ts                                  Tool registry + JSON-RPC dispatch
app/api/mcp/route.ts                               MCP endpoint (POST/GET/OPTIONS), bearer → dispatch, 401
app/api/mcp/register/route.ts                      Dynamic Client Registration
app/api/mcp/token/route.ts                         Token endpoint (auth_code + PKCE, refresh)
app/api/mcp/metadata/authorization-server/route.ts RFC 8414 metadata
app/api/mcp/metadata/protected-resource/route.ts   RFC 9728 metadata
app/mcp/authorize/page.tsx                         Consent screen (login-gated)
app/mcp/authorize/actions.ts                       approveMcpAuthorization (issues PKCE code)
app/actions/mcp.ts                                 disconnectMcpConnection
app/(app)/settings/integrations/page.tsx           "Connect to Claude" card + connection list
next.config.ts                                     Rewrites: /.well-known/* → /api/mcp/metadata/*
```

---

## 9. Configuration

| Env var                     | Use                                                        | Status   |
| --------------------------- | ---------------------------------------------------------- | -------- |
| `NEXT_PUBLIC_APP_URL`       | Base URL for all metadata/endpoints (`getAppUrl()`)        | existing |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role client that calls the RPCs and manages tokens | existing |

No `SUPABASE_JWT_SECRET` and no new dependencies. The Claude callback
`https://claude.ai/api/mcp/auth_callback` is enforced as an allowlist constant
(`CLAUDE_REDIRECT_URI`) — nothing to register statically.

---

## 10. Deploy & verify

**Deploy**

1. Push the migration to Supabase (`supabase db push`). It's additive (3 tables, 1 role, RLS,
   RPCs). Confirm PostgREST reloads its schema so the RPCs are callable.
2. Deploy the app.
3. Open **Settings → Integrations → Connect to Claude**, complete OAuth, run a tool from Claude.

**Local verification (no Claude)** — `npm run lint` + `npm run build` must be clean, then:

- `curl` the two `.well-known` metadata URLs → correct JSON.
- `curl -X POST /api/mcp` with no token → `401` + `WWW-Authenticate`.
- The RPC/RLS behaviour itself only runs after the migration is pushed (needs the DB).

**Post-deploy check (do this):** with a token for org A, confirm a tool returns A's data; confirm
a token for org B never sees A's rows.

---

## 11. Known limitations / caveats

- **One org per user is assumed.** The consent lookup takes a single `organization_members`
  row. If a user could belong to multiple orgs, the authorize page would need an org picker.

- **Migration ownership step.** The migration reassigns function ownership to `mcp_readonly`
  (`GRANT mcp_readonly TO current_user` first). This is standard, but if the migration role
  can't take that membership it will error — **push to a preview/branch DB first**.

- **Refresh tokens** rotate on each use and carry a **90-day idle** expiry
  (`refresh_expires_at`, `REFRESH_TOKEN_TTL_SECONDS`) that each refresh slides forward — an
  actively-used connection never expires; only one unused for 90 days lapses and must
  reconnect. Disconnect (deleting the row) revokes immediately.

- **End-to-end OAuth** with Claude can only be validated on a deployed HTTPS URL; local checks
  stop at build/lint + curl of metadata/401.

- The AR reads run under the service-role client; the enforcement boundary is the **RPC
  function** (read-only + RLS). `lib/mcp/queries.ts` must therefore only ever call the RPCs,
  never raw table reads — it's the one small, auditable module that must hold that line.
  
  ```
  
  ```
