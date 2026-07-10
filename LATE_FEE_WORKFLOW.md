# Duely Late Fee Logic and Workflow

This document outlines the end-to-end architecture and workflow for Duely's Late Fee automation system.

## 1. Database Trigger & Webhook

The process begins natively at the database level when new invoices are fetched or created.
- **Trigger**: A PostgreSQL trigger (`trg_invoice_insert_webhook`) listens for `INSERT` events on the `invoices` table.
- **Webhook via pg_net**: When an invoice is inserted, the trigger uses `pg_net` to fire an asynchronous POST request to the Next.js API route `/api/webhooks/supabase/route.ts`.
- **Security**: The payload is secured using a `SUPABASE_WEBHOOK_SECRET` passed in the `Authorization` header.

## 2. Event Evaluation (Inngest)

Once the webhook receives the payload, it dispatches an Inngest event: `invoice.evaluate_late_fee`.
- **Worker**: `lib/inngest/functions/late-fee-workflow.ts`
- **Eligibility Check**: The workflow checks if the invoice belongs to a client group that has an active late fee policy.
- **New Invoices Only constraint**: The system explicitly blocks retroactive application. It verifies that the invoice's `created_at` timestamp is *after* the policy's `created_at` timestamp. If the invoice is older than the policy, the workflow safely exits.
- **Scheduling**: If a valid policy applies, the workflow calculates the exact execution date (`invoice due date + policy grace period days`) and enters a sleeping state using Inngest's `step.sleepUntil`.

## 3. Cancellation Events

While the workflow is sleeping, it actively listens for state changes that invalidate the late fee. The workflow will automatically cancel (`cancelOn`) if:
- The invoice is fully paid (`invoice.paid`).
- The invoice status manually changes to something outside of an overdue state (`invoice.status_changed`).

## 4. The Action Phase (Auto vs Manual)

Once the timer expires (and if the invoice is still unpaid), the workflow wakes up to apply the fee.
- **Fee Calculation**: It calculates the fee based on the policy (either a fixed flat fee or a percentage of the outstanding balance).
- **Auto-Approve Enabled**: If the policy has `auto_approve` set to true, it immediately fires the execution event `invoice.apply_late_fee`.
- **Manual Review (Drafts)**: If `auto_approve` is false, it inserts a record into the `email_drafts` table with `action_type: "late_fee"` and stores the calculated `fee_amount` and `due_date` inside the JSON `action_payload`.
    - This draft appears in the user's **Automate** tab UI.
    - The user can review the draft, manually override the fee amount, optionally set a strict due date, and then click "Approve & Send".
    - Clicking approve fires the `invoice.apply_late_fee` event with the overridden values.

## 5. Execution & Accounting Sync (`process-late-fee.ts`)

The `invoice.apply_late_fee` event is handled by `lib/inngest/functions/process-late-fee.ts`.
- **Strict Separation**: The system *never* modifies the original invoice balance.
- **Accounting API Push**: It communicates directly with the Xero or QuickBooks APIs (`lib/xero-write.ts` / `lib/quickbooks-write.ts`) to generate a brand **new, separate invoice** representing the late fee.
- **Naming / Reference**: The new invoice uses the original invoice number in the line-item description for clear reference (e.g., "Late fee for invoice INV-001").
- **Due Date**: For both Xero and QuickBooks, the due date is strictly calculated based on the policy's `due_days` setting (`date generated + due_days`). If not provided, it defaults to the creation date (today) in Xero, or the company's default terms in QuickBooks.

## 6. Notification

Immediately after the accounting API successfully creates the new late fee invoice, the worker sends an email notification to the client.
- The email is dispatched via the user's connected Gmail account (or Resend fallback).
- The email template explicitly informs the client that "A separate invoice for a late fee has been generated," leaving the original invoice untouched.
