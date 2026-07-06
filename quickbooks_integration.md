# QuickBooks Integration Architecture

This document outlines the QuickBooks integration in the Duely system, which utilizes a highly efficient webhook-driven event architecture mirroring our Xero setup.

## Overview

The QuickBooks integration provides real-time, bidirectional sync between QuickBooks and Duely. Instead of pulling the entire ledger on a cron schedule, Duely listens to QuickBooks webhooks for targeted updates.

## Target Architecture: Webhook-Driven Sync

### Flow 1: Initial Sync (One Time on QuickBooks Connect)
When the user connects their QuickBooks account, a background Inngest job fetches the full initial batch of ACCREC invoices and payments. Once finished, it establishes a `last_synced_at` baseline.

### Flow 2: QuickBooks → Duely (Inbound Webhook)
QuickBooks fires a POST to `/api/webhooks/quickbooks` whenever an invoice, payment, or customer changes.

- **Idempotency**: Handled using the `webhook_events` table to ensure duplicate events are skipped.
- **Targeted Fetch**: When an `Invoice` or `Payment` webhook arrives, the handler makes exactly ONE API call to fetch the specific payload. 
- **Security**: The webhook handler strictly verifies the HMAC-SHA256 signature using the `intuit-signature` header against `QUICKBOOKS_WEBHOOK_TOKEN`.

### Flow 3: Duely → QuickBooks (Outbound Push)
When a user takes an action in Duely (e.g., automated late fees or logging a manual payment):
- **Source of Truth**: The Duely DB is updated first.
- **Push**: Duely makes a targeted QuickBooks API call to reflect the change.
- **Loop Prevention**: QuickBooks will naturally fire a webhook back to Duely for this change. The `updated_at` timestamps on invoices prevent Duely from overwriting its own newer data with the webhook payload.

## Data Directionality & Dual Sync Truth Rule

*   **From QuickBooks to Duely:**
    *   **Invoices:** All invoices are pulled from QuickBooks. The webhook actively pulls `InvoiceLink` (payment link) and other metadata.
    *   **Payments:** Webhooks actively trigger targeted `fetchQuickBooksPayment` queries to log exact transaction amounts and dates in the Duely `payments` table.
*   **From Duely to QuickBooks:**
    *   **Late Fees:** The automated late fee system pushes changes (either as a new LineItem on an existing invoice or a new invoice) directly to QuickBooks.
    *   **Manual Payments:** Payments logged manually in Duely can be pushed to QuickBooks.
*   **Dual Sync Truth Rule & Soft Deduplication:**
    *   If an invoice exists in both systems, Duely compares the `updated_at` timestamps. If the Duely invoice was updated *more recently* than the QuickBooks invoice, the sync script **skips** overwriting the local Duely record.
    *   **Soft-Deduplication**: When pushing a payment to QuickBooks, QuickBooks immediately fires a webhook back. To prevent an infinite loop where Duely re-logs the same payment, the webhook handler actively searches for unlinked manual payments matching the exact amount and date. If a match is found, it silently links the QuickBooks ID instead of creating a duplicate row.

## Multi-Tenancy

Unlike Xero, Intuit's OAuth flow requires the user to pick exactly *one* company (tenant) on the Intuit consent screen *before* redirecting back to Duely. Therefore, Duely receives exactly one `realmId` (tenant ID) in the OAuth callback. A single Duely workspace is strictly locked 1:1 with the selected QuickBooks company.

The webhook handler uses the `realmId` from the webhook payload to route the event to the correct Duely organization.

## Token Management (Critical)

QuickBooks OAuth tokens are strict. Before querying the QuickBooks API, `lib/quickbooks.ts` checks the `expires_at` timestamp. If it is within 5 minutes of expiration, it automatically negotiates a new set of tokens and updates the `integrations` table.

## Strict Stability Warning

**The QuickBooks integration (OAuth flow, webhooks, payment pushing, syncing) is fully functional, loop-free, and stable.**

Under no circumstances should any QuickBooks integration code (e.g., `lib/quickbooks.ts`, `app/api/webhooks/quickbooks/route.ts`) be modified, refactored, or touched unless explicitly requested by the user to fix a specific bug. Any modifications must be narrowly scoped to preserve this delicate stability.
