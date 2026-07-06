# Background Jobs & Automation (Inngest)

This document outlines the background job architecture in Duely, powered by Inngest. 
Inngest is used to reliably schedule and execute long-running tasks, recurring cron jobs, and event-driven background processes without hitting Vercel's serverless timeout limits.

## Overview of Inngest Functions

All Inngest functions are located in `lib/inngest/functions/` and are registered in the main Inngest API route at `app/api/inngest/route.ts`.

### 1. `apply-late-fees` (Cron Job: Hourly)
- **Schedule:** Runs at `0 * * * *` (every hour).
- **Purpose:** Automatically calculates and applies late fees to overdue invoices based on user-defined policies.
- **Logic:**
  1. **Timezone Check:** It fetches the organization admin's timezone and only processes the late fees if it is currently midnight locally for that specific admin.
  2. **Eligibility:** It checks if the invoice has passed its due date and exceeded the policy's grace period. It also skips invoices belonging to excluded customer groups.
  3. **Frequency:** It checks the `applied_late_fees` table to ensure fees are only applied according to the schedule (e.g., once, weekly, monthly).
  4. **Calculation:** Computes flat or percentage fees based on the remaining balance.
  5. **Execution:** Depending on the policy, it either appends a new LineItem to the existing invoice or creates a completely new "Late Fee" invoice. It pushes these changes directly to Xero or QuickBooks.
  6. **Notification:** Sends an automated email to the client notifying them of the new balance.

### 2. `send-reminders` (Cron Job: Hourly)
- **Schedule:** Runs at `0 * * * *` (every hour).
- **Purpose:** Dispatches automated email reminders for outstanding invoices or to clients with overdue balances.
- **Logic:**
  1. **Query:** Fetches all clients and invoices where `next_send_at` is less than or equal to the current time.
  2. **Locking Mechanism:** Uses a `CLAIM_WINDOW_MS` (5 minutes) lease system to temporarily lock rows in the database, preventing race conditions or double-sending if the cron job overlaps or retries.
  3. **Templating:** Replaces placeholders (like `{{ company_name }}`, `{{ total_owed }}`) in the user's custom HTML email templates.
  4. **Dispatch:**
     - If the entity has `auto_approve: true`, it sends the email immediately via Resend or the user's connected Gmail integration.
     - If `auto_approve: false`, it drafts the email and leaves it in the queue for manual approval by the user.
  5. **Rescheduling:** Calculates the next `next_send_at` time based on the cadence (recurring frequency) or the next step in the sequence.

### 3. `xero-initial-sync` (Event-Driven)
- **Trigger:** Listens for the `xero/integration.connected` event.
- **Purpose:** Bypasses Vercel's strict serverless timeout limits during massive initial data syncs.
- **Logic:**
  - When a user connects Xero, this job is triggered.
  - It fetches exactly one page (chunk) of data at a time.
  - If there is more data, it recursively triggers a new Inngest event (`queue-next-page`) for itself to process the next chunk in a fresh execution context.
  - This ensures that syncing 10,000+ invoices will never time out the Vercel function.

### 4. `sync-quickbooks` (Event-Driven)
- **Trigger:** Similar to Xero, handles the heavy lifting of importing QuickBooks data in the background upon connection.

### 5. `send-digest` (Cron Job / Scheduled)
- **Purpose:** Compiles a summary of system activity (e.g., payments received, reminders sent) and sends it to the organization's admins.

## Best Practices & Guidelines

1. **Idempotency:** Always assume Inngest functions can run more than once. Use database locks (like the `claimEntity` function) or idempotency keys to prevent duplicate actions.
2. **Serverless Timeouts:** Never write loops that fetch unlimited paginated data in a single run. Always use Inngest's step tools or recursive events for heavy data processing.
3. **External API Limits:** Since these run in the background, they respect the rate limits of external APIs (Xero, QuickBooks, Gmail) and use `logger.external()` to log failures gracefully.
