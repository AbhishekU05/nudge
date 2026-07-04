# QuickBooks Integration Architecture

This document outlines the QuickBooks integration in the Duely system, including the synchronization flow, data directionality, and edge cases.

## Overview

The QuickBooks integration is primarily designed as a **one-way pull** from QuickBooks into Duely. QuickBooks acts as the source of truth for invoice creation and payment processing. Duely fetches these invoices, maps them to clients, tracks their status, and logs payments.

Currently, **no standard financial data is pushed from Duely to QuickBooks**. Invoices or payments created locally in Duely remain exclusively in Duely. (The sole exception is automated Late Fees, detailed below).

## Data Directionality & Dual Sync Truth Rule

*   **From QuickBooks to Duely:**
    *   **Invoices:** All invoices are pulled from QuickBooks.
    *   **Clients/Contacts:** Client names and emails are extracted from the invoices (and supplemented via a separate `Customer` query if needed) to build the local `clients` database.
    *   **Payments:** Following the exact same architecture as Xero, Duely makes a dedicated query to the QuickBooks `Payment` API. It parses the payment `Line` items to find which specific invoices the payment was applied to, and logs precise transaction amounts and dates in the Duely `payments` table.
*   **From Duely to QuickBooks:**
    *   **Late Fees Only:** Just like Xero, Duely does not create invoices or payments in QuickBooks EXCEPT when an automated Late Fee policy fires. If a late fee is triggered:
        *   If the policy is "append to existing", Duely fetches the specific QuickBooks invoice, appends a new `Line` item (Item-based) for the fee, and pushes the update to QuickBooks.
        *   If the policy is "create new invoice", Duely generates a completely separate QuickBooks invoice for the late fee and publishes it to the ledger.
*   **Dual Sync Truth Rule:**
    *   If an invoice exists in both systems, Duely compares the `updated_at` timestamps. If the Duely invoice was updated *more recently* than the QuickBooks invoice (e.g., a user manually marked an invoice as paid in Duely), the sync script **skips** overwriting the local Duely record. This ensures manual actions taken in Duely are preserved.

## Multi-Tenancy

Unlike Xero (where the API returns an array of authorized tenants for the user to select), Intuit's OAuth flow requires the user to pick exactly *one* company (tenant) on the Intuit consent screen *before* redirecting back to Duely. 

Therefore, Duely receives exactly one `realmId` (tenant ID) in the OAuth callback. There is no intermediate "Tenant Selection" UI required for QuickBooks. A single Duely workspace is strictly locked 1:1 with the selected QuickBooks company.

## Sync Logic Details

### 1. Token Management
QuickBooks OAuth tokens are strict. `access_token` usually expires in 60 minutes, while the `refresh_token` lasts around 100 days (but rotates frequently). Before querying the QuickBooks API, `lib/quickbooks.ts` checks the `expires_at` timestamp. If it is expired (or close to expiring), it automatically negotiates a new set of tokens and updates the `integrations` table.

### 2. Client Identity Resolution
When processing a QuickBooks invoice, the sync script extracts the customer's `CustomerRef`.
*   It tries to resolve the contact's name and email by looking up the `CustomerRef` against a batch query of QuickBooks customers.
*   It searches the local `clients` table by **email**.
*   If no match, it falls back to searching by **name**.
*   If still no match, it creates a **new client** in the `clients` table.

### 3. Invoice Updating & Workflow Status
*   Invoices are mapped using `quickbooks_id` (the invoice `Id` field in QuickBooks).
*   The `status` (outstanding, paid, partial, overdue) is calculated dynamically based on `TotalAmt`, `Balance`, and `DueDate`.

### 4. Exact Payment Syncing
After invoices are updated, the script queries the `Payment` endpoint to pull down all QuickBooks payment records. Because a single QuickBooks payment can pay off *multiple* invoices at once, the script parses the `Line` array of each payment, checking for `LinkedTxn` items of type `Invoice`. It maps these payments to the local invoices and records the exact date and amount in Duely. The QuickBooks internal payment `Id` is saved as `reference_id` to ensure idempotency and prevent duplicates.

## Edge Cases & Pitfalls

*   **MinorVersion Handling:** The QuickBooks API requires a `minorversion` query parameter for certain fields to be returned. Duely currently forces `minorversion=65` for consistency.
*   **Stale Data:** Because Duely relies on scheduled or manual syncs (pulls), the data in Duely can be slightly stale compared to QuickBooks until the next sync runs.
*   **Token Expiration Cascades:** If a `refresh_token` expires completely (e.g., 100 days of inactivity), the user must fully disconnect and reconnect their QuickBooks account.
