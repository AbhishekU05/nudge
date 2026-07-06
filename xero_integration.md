# Xero Integration Architecture

This document outlines the Xero integration in the Duely system, which now uses a highly efficient webhook-driven event architecture.

## Overview

The Xero integration provides real-time, bidirectional sync between Xero and Duely. Instead of pulling the entire ledger on a cron schedule, Duely listens to Xero webhooks for targeted updates.

## Target Architecture: Webhook-Driven Sync

### Flow 1: Initial Sync (One Time on Xero Connect)
The only time Duely fetches the entire invoice and payment history is when the user first connects Xero. Due to Xero's pagination limits and Vercel's serverless timeouts, this is handled via a **chunked, event-driven pagination** system:
- **Trigger**: User completes Xero OAuth and tenant selection.
- **Action**: 
  - An Inngest background job (`xero-initial-sync`) fetches Page 1 (100 records) of ACCREC invoices, upserts them, and gracefully exits.
  - If more invoices exist, it fires an event to queue a new background task for Page 2, Page 3, etc.
  - Once invoices are exhausted, it automatically switches to paginating payments chunk by chunk.
- **Result**: Each chunk is isolated to a few seconds, completely avoiding serverless timeout limits. When the final payment page is processed, `integrations.last_synced_at` is set, establishing the baseline.

### Flow 2: Xero → Duely (Inbound Webhook)
Xero fires a POST to `/api/webhooks/xero` whenever an invoice or contact changes (Xero does not natively support webhooks for Payments).

- **Idempotency**: Handled using the `webhook_events` table to ensure duplicate events are skipped.
- **Targeted Fetch**: When an `INVOICE` webhook arrives, the handler makes exactly ONE API call to fetch the specific invoice payload. 
- **Implicit Payment Sync**: Because Xero does not send `PAYMENT` webhooks, applying a payment to an invoice triggers an `INVOICE` webhook (since its balance changes). The Duely webhook handler extracts the `payments` array from the fetched invoice and syncs any new payments simultaneously.
- **Security**: The webhook handler strictly verifies the HMAC-SHA256 signature using the `x-xero-signature` header against `XERO_WEBHOOK_KEY`.

### Flow 3: Duely → Xero (Outbound Push)
When a user takes an action in Duely (e.g., automated late fees):
- **Source of Truth**: The Duely DB is updated first.
- **Push**: Duely makes a targeted Xero API call to reflect the change.
- **Loop Prevention**: Xero will naturally fire a webhook back to Duely for this change. The `updated_at` timestamps on invoices (the "Dual Sync Truth Rule") prevent Duely from overwriting its own newer data with the webhook payload.

## Data Directionality & Dual Sync Truth Rule

*   **From Xero to Duely:**
    *   **Invoices:** All outstanding and paid invoices are tracked. The webhook fetches the exact invoice upon an `INVOICE` event. It also actively pulls `OnlineInvoiceUrl` (payment link) and the `reference` field for display in the Duely portal.
    *   **Payments:** Exact payments are extracted from the parent invoice payload during an `INVOICE` webhook event, preventing inference errors while bypassing Xero's lack of payment webhooks.
*   **From Duely to Xero:** 
    *   **Late Fees:** The automated late fee system pushes changes (either as a new LineItem on an existing invoice or a new invoice) directly to Xero.
    *   **Manual Payments:** Payments logged manually in Duely are pushed directly to Xero with a custom reference of `"Logged via Duely"` for auditability.
*   **Dual Sync Truth Rule & Soft Deduplication:** 
    *   If an invoice exists in both systems, Duely compares the `updated_at` timestamps. If the Duely invoice was updated *more recently* than the Xero invoice (e.g., a user manually marked an invoice as paid in Duely), the webhook handler **skips** overwriting the local Duely record. 
    *   **Soft-Deduplication**: When pushing a payment to Xero, Xero immediately fires a webhook back. To prevent an infinite loop where Duely re-logs the same payment, the webhook handler actively searches for unlinked manual payments matching the exact amount and date. If a match is found, it silently links the Xero ID instead of creating a duplicate row.

## Multi-Tenancy & Advisor Mode

Xero accounts can have access to multiple organizations (tenants), such as an accounting firm managing dozens of clients.

1.  **OAuth Connection:** When a user authorizes Xero, the API returns a list of all granted tenants.
2.  **Tenant Selection:** 
    *   If multiple tenants are returned, it sets `tenant_id: "PENDING_SELECTION"` and redirects the user to choose.
3.  **Webhook Routing:** Xero registers webhooks globally per developer app, not per org. The webhook handler receives events for *all* connected orgs and uses the `tenantId` in the payload to correctly route the update to the mapped Duely organization.

## Token Management (Critical)

Xero OAuth tokens expire. The webhook handler uses the helper `getValidXeroClient()` before every Xero API call. If the stored token is within 5 minutes of expiration, it automatically uses the refresh token to get a new access token, updates the `integrations` table, and then proceeds with the webhook event.

## Strict Stability Warning

**The Xero integration (OAuth flow, webhooks, payment pushing, syncing) is fully functional, loop-free, and stable.**

Under no circumstances should any Xero integration code (e.g., `lib/xero.ts`, `app/api/webhooks/xero/route.ts`, `lib/integrations-push.ts`) be modified, refactored, or touched unless explicitly requested by the user to fix a specific bug. Any modifications must be narrowly scoped to preserve this delicate stability.
