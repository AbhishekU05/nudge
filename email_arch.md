# Email Architecture

This document outlines the email dispatching and drafting system in Duely. Duely needs to send automated reminders, late fee notifications, and digests to clients reliably, while offering users the option to review emails before they are sent and ensuring high deliverability.

## 1. Event-Driven Workflow (Inngest)

Duely uses a durable, event-driven architecture powered by Inngest rather than traditional cron-based polling to manage email reminders.
When an automation is enabled, an `automation.enabled` event triggers a long-running Inngest workflow (`automation-workflow.ts`).

- **Durable Sleeps**: The workflow uses `step.sleepUntil` to pause execution down to the millisecond of the scheduled send time. This removes database polling overhead entirely.
- **Split Transaction Steps**: Fetching data and sending the email are grouped into an idempotent `step.run` block, but immediately advancing to the next sequence item is split into a *separate* `step.run` block. Because Inngest checkpoints state after each step, if the workflow crashes after sending the email, it will retry *only* the sequence-advancement step, ensuring the user is never emailed twice.
- **Cancellation**: Workflows listen for `automation.disabled` or `invoice.paid` events. If received, the workflow instantly halts and exits early.

## 2. Dual-Dispatch Engine (Gmail + Resend Fallback)

Duely uses a dual-dispatch engine to guarantee delivery while offering a premium native experience if the user desires it.

### **Primary: Gmail API Integration (`lib/gmail.ts`)**
If an organization admin has connected their Google account via the Settings page, Duely prefers sending emails natively through the Gmail API. 
- **User Experience**: Emails appear directly in the sender's own "Sent" folder in Gmail. They come from the user's exact email address, massively increasing open rates and preventing spam filters.
- **Token Management**: The background jobs use the stored `google_refresh_token` to seamlessly fetch a fresh `access_token` in the background if the old one has expired. It then builds a raw RFC 2822 email and sends it via the `messages/send` API.
- **Reliability Check**: The `hasGmailTokens()` helper determines if a valid connection exists before attempting. If the Gmail API throws a non-401 error (or the token is completely revoked), the system automatically gracefully downgrades to Resend.

### **Fallback: Resend API (`lib/resend.ts`)**
If the user hasn't connected Gmail, or if the Gmail API throws a fatal error, Duely uses Resend.
- **User Experience**: Emails are sent from the centralized `reminders@duely.in` address. 
- **Spoofing Prevention**: To comply with DMARC policies, Duely does *not* try to spoof the user's "From" address. Instead, it formats the "From" header as `User Name via Duely <reminders@duely.in>`.
- **Reply Routing**: It actively sets the `Reply-To` header to the organization admin's email address, ensuring any replies from the client go directly back to the user.

## 3. Bounce and Complaint Protection (Webhooks)

To protect domain reputation and prevent infinite failure loops, Duely actively listens to delivery webhooks from Resend (`app/api/webhooks/resend/route.ts`).

- **Automatic Pausing**: If an `email.bounced`, `email.failed`, or `email.complained` event is received, the webhook immediately finds all active client or invoice automations targeting that email address and sets `reminders_enabled = false` / `active = false`. It dispatches `automation.disabled` to instantly kill the sleeper threads.
- **Admin Alert**: It identifies the Organization Owners/Admins associated with that email and automatically dispatches a transactional Resend email alerting them that the automation was paused, providing tailored instructions based on whether it was a bounce or a spam complaint.

## 4. Drafting & Auto-Approve Workflow

The workflow respects the `auto_approve` flag configured by the user on the client or invoice level.

### **Manual Review (Drafts)**
If `auto_approve: false`:
- The background job skips the Gmail/Resend dispatch entirely.
- It calculates the final parsed email content (replacing all templated variables) and inserts a new row into the `email_drafts` table with `status: "draft"`.
- The user can log into the Duely dashboard, view their queue of pending drafts, edit the content, and hit "Send" manually.

### **Auto-Approve**
If `auto_approve: true`:
- The background job directly invokes the dispatch engine (trying Gmail, then Resend).
- Upon success, it inserts the email into `email_drafts` with `status: "sent"` and records the `sent_at` timestamp for auditability.

## 5. Dynamic Templating (`processTemplate`)

Users define raw HTML templates with merge variables (e.g., `{{ first_name }}`, `{{ amount_owed }}`) in their reminder sequences.

Because email clients are notoriously bad at rendering complex HTML, the `processTemplate` helper performs a multi-step sanitation:
1. Replaces standard tags (`<p>`, `<br>`) with plaintext newlines.
2. Strips out all remaining HTML elements to prevent breaking styling or causing spam flags.
3. Condenses excessive newlines into readable paragraph spacing.
4. Uses a Regex sweep to replace all instances of `{{ variable_name }}` with the injected data.
5. Injects a final dynamically generated list of outstanding invoices and the specific portal payment link (`https://duely.in/portal/[token]`).
