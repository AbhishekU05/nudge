# Integration Architecture (Xero & QuickBooks)

This document describes how the third-party integrations (Xero and QuickBooks) work in the Nudge system. It serves as a guide for future developers to understand the synchronization process without needing to reverse-engineer the logic.

## Overview

The integration synchronizes financial data from third-party accounting platforms into our system. It specifically imports outstanding, partially paid, and fully paid invoices, tying them to their respective customer records. 

The core flow is:
1. **OAuth Flow:** User authorizes Nudge. We store tokens in the `integrations` table.
2. **Fetch Invoices:** We fetch the latest invoice records from the external provider.
3. **Map to Clients:** We extract customer information from the invoices and map them to records in our `clients` table using email or name matching.
4. **Upsert Invoices:** We insert or update the `invoices` table to keep local balances and workflow statuses in sync.
5. **Log Payments:** Any newly observed payments (difference between remote amount paid and local amount paid) are logged to the `customer_events` table as payment events.

## Database Schema (The "Split")

Historically, the system had a monolithic `customers` table that acted as both the client identity and the specific invoice balance. 

As of migration `20260621142826` and `20260621153000`, the data model was split into:

1. **`clients` Table**
   - Represents the unique customer identity (e.g., "Acme Corp").
   - Contains contact info (`name`, `email`).
   - Contains **client-level** automation settings (e.g., `reminder_frequency_days`, `next_send_at`, `active`, `reminder_type`, `reminder_templates`).
2. **`invoices` Table**
   - Represents a specific outstanding balance or bill.
   - Contains a `customer_id` referencing the `clients` table.
   - Holds financial data (`amount_owed`, `amount_paid`, `currency`, `due_date`, `workflow_status`).
   - Contains provider-specific IDs (`xero_invoice_id`, `quickbooks_invoice_id`, `stripe_invoice_id`).
   - Contains **invoice-level** automation settings (e.g., `active`, `auto_approve`, `next_send_at`).
3. **`customer_events` Table**
   - An append-only timeline.
   - Contains **both** `invoice_id` and `customer_id` to link a payment/followup event to both the bill and the underlying client.

## Sync Logic Details

### 1. Token Management
Both `lib/xero.ts` and `lib/quickbooks.ts` check the `expires_at` timestamp of the stored OAuth tokens in the `integrations` table. If the token is near expiration, they automatically refresh it before querying the API.

### 2. Client Identity Resolution
When processing an invoice, the sync scripts extract the client's email and name. 
- They first try to find an existing client in the local DB (`clients` table) by **email**.
- If no match, they try to match by **name**.
- If still no match, a **new client** is inserted into the `clients` table. Note: Currently, new clients are inserted with default automation settings (`active: false` on the client level unless updated).

### 3. Invoice Updating
- We fetch existing invoices from the database using the provider ID (e.g., `xero_invoice_id`).
- If an existing invoice is found, we compare the local `amount_paid` with the remote `amount_paid`.
- The `workflow_status` is updated based on logic (e.g., if remote `Balance <= 0`, it is marked as `paid`).
- The `invoices` row is updated with the new `amount_paid` and status.

### 4. Event Logging (Payment Logs)
If a newly paid amount is detected (i.e., `remote_paid > local_paid`), a new event is inserted into the `customer_events` table:
- `event_type`: `"payment"`
- `invoice_id`: The ID of the updated/inserted invoice.
- `customer_id`: The ID of the client (essential for rendering the client's timeline).
- `amount`: The delta of what was paid.

## Common Pitfalls & Recent Fixes

- **`active` Column Conflicts:** Previously, sync scripts assumed `active` only existed on the `invoices` table or attempted to disable automation when an invoice was paid. Invoice-level automation and client-level automation both exist, but blindly setting `active: false` on an invoice update can conflict with client-level settings.
- **Missing `customer_id` on Events:** The database relies on `customer_events.customer_id` to display unified timelines for clients. The sync scripts were previously missing this field when inserting new payments, leading to orphaned timeline events. This is now fixed.

## Adding a New Provider
If you're adding another accounting software integration:
1. Copy the patterns from `lib/xero.ts`.
2. Add a new `provider` enum to the `integrations` table in Supabase.
3. Add a corresponding `[provider]_invoice_id` column to the `invoices` table.
4. Ensure the sync maps both the `invoices` table and `clients` table accurately, and attaches `customer_id` to any new `customer_events` rows.
