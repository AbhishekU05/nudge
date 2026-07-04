# Xero Integration Architecture

This document outlines the Xero integration in the Duely system, including the synchronization flow, multi-tenancy support, data directionality, and edge cases.

## Overview

The Xero integration is designed as a **one-way pull** from Xero into Duely. Xero is treated as the source of truth for invoice creation and payment processing. Duely fetches these invoices, maps them to clients, tracks their status, and logs payments. 

Currently, **no data is pushed from Duely to Xero**. Invoices or payments created locally in Duely remain exclusively in Duely.

## Data Directionality & Dual Sync Truth Rule

*   **From Xero to Duely:**
    *   **Invoices:** All outstanding and paid invoices (Type == "ACCREC") are pulled from Xero.
    *   **Clients/Contacts:** Client names and emails are extracted from the invoices to build the local `clients` database.
    *   **Payments:** Instead of naively inferring payments from invoice balance changes, Duely directly queries the Xero Payments endpoint (`getPayments`). Each individual Xero payment (whether partial or full) is recorded in the Duely `payments` table with its exact transaction date, amount, and unique `paymentID` (stored as `reference_id` to ensure idempotency).
*   **From Duely to Xero:** 
    *   **Late Fees Only:** As a general rule, Duely does not push changes to Xero. The **only** exception is the Automated Late Fee system. When a late fee is applied by a Duely background job:
        *   If the policy is set to "append to existing", Duely calls the Xero API, fetches the invoice, appends a new `LineItem` for the late fee to the existing invoice, and saves it.
        *   If the policy is set to "create new invoice", Duely generates a brand new invoice in Xero for the late fee amount, assigned to the same contact.
*   **Dual Sync Truth Rule:** 
    *   If an invoice exists in both systems, Duely compares the `updated_at` timestamps. If the Duely invoice was updated *more recently* than the Xero invoice (e.g., a user manually marked an invoice as paid in Duely before Xero could sync it), the sync script **skips** overwriting the local Duely record. This ensures manual actions taken in Duely are not clobbered by delayed accounting syncs.

## Multi-Tenancy & Advisor Mode

Xero accounts can have access to multiple organizations (tenants), such as an accounting firm managing dozens of clients.

1.  **OAuth Connection:** When a user authorizes Xero, the Xero API returns a list of all tenants the user granted access to.
2.  **Tenant Selection:** 
    *   If only one tenant is returned, it is automatically connected to the Duely organization.
    *   If multiple tenants are returned, the integration saves the Xero connection with `tenant_id: "PENDING_SELECTION"` and redirects the user to `/settings/integrations/xero/tenant`.
3.  **Firm Mapping:** On the tenant selection page, the user must explicitly choose *one* Xero tenant to map to their current Duely workspace. Currently, the architecture enforces a strict **1:1 mapping** (One Duely Organization = One Xero Tenant).

## Sync Logic Details

### 1. Token Management
OAuth tokens (`access_token` and `refresh_token`) are stored in the `integrations` table. Before querying the Xero API, `lib/xero.ts` checks the `expires_at` timestamp. If the token is near expiration (within 5 minutes), it automatically negotiates a new token using the refresh token and updates the database before proceeding.

### 2. Client Identity Resolution
When processing a Xero invoice, the sync script extracts the contact's name and email:
*   It searches the local `clients` table by **email**.
*   If no match, it falls back to searching by **name**.
*   If still no match, it creates a **new client** in the `clients` table.
*   All subsequent invoices for this Xero contact are mapped to this resolved `client_id`.

### 3. Invoice Updating & Workflow Status
*   Invoices are mapped using `xero_id`.
*   The `status` (outstanding, paid, partial, overdue) is calculated dynamically based on `amountDue`, `amountPaid`, and `dueDate`.
*   The `invoices` row is inserted or updated accordingly.

### 4. Exact Payment Syncing
After invoices are updated, the script performs a dedicated pull from Xero's `Payments` API. It maps every payment to its corresponding local invoice and records the precise transaction date and amount. Xero's internal `paymentID` is saved as `reference_id` in Duely to prevent duplicate logs on subsequent syncs.

## Edge Cases & Pitfalls

*   **Pending Selection State:** Background syncs must check if `tenant_id === "PENDING_SELECTION"`. If true, the sync aborts to prevent querying Xero without a specific target tenant.
*   **Missing Emails:** Xero contacts sometimes lack email addresses. The sync script handles this by falling back to name-matching to prevent creating duplicate clients for the same name, but this can cause collisions if two different companies have the exact same name but no email.
*   **Zero Dollar Invoices:** Invoices with a total of `$0.00` are explicitly skipped during the sync process.
*   **Stale Data:** Because Duely relies on scheduled or manual syncs (pulls), the data in Duely can be stale compared to Xero until the next sync runs.
*   **No Webhooks:** Currently, the system relies on pulling data. Xero webhooks are not implemented, meaning instant updates from Xero do not occur.
