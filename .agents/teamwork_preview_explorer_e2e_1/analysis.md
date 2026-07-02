# Next.js Server Actions Testing Strategy and Test Plan

This document outlines the testing strategy, mocking approach, and detailed test suites for the 11 Next.js server actions defined in `app/actions/`.

---

## 1. Analysis of the 11 Server Actions

### `auth.ts`
* **Function Signatures**:
  * `signup(formData: FormData): Promise<never>`
  * `login(formData: FormData): Promise<never>`
  * `logout(): Promise<never>`
  * `updateProfileName(formData: FormData): Promise<never>`
  * `signInWithGoogle(formData: FormData): Promise<never>`
  * `requestPasswordReset(formData: FormData): Promise<never>`
  * `resetPassword(formData: FormData): Promise<never>`
  * `updateDigestSettings(formData: FormData): Promise<never>`
  * `updateProfileInfo(formData: FormData): Promise<never>`
* **Supabase Tables Queried/Modified**:
  * Reads auth users via admin client: `auth.admin.listUsers` (in helper `isExistingAuthEmail`)
  * Triggers signup: `auth.signUp`
  * Triggers login: `auth.signInWithPassword`
  * Triggers logout: `auth.signOut`
  * Updates auth metadata: `auth.updateUser`
  * Updates `profiles` table: `.update({ timezone, weekly_digest_enabled })` and `.update({ first_name, last_name, company_name })`
* **Auth, Redirects, and Revalidation**:
  * Public endpoints (`signup`, `login`, `signInWithGoogle`, `requestPasswordReset`) do not perform session auth checks. They use cookies (`failed_login_attempts`, `forgot_password_attempts`) for stateful rate limiting.
  * User endpoints (`resetPassword`, `updateDigestSettings`, `updateProfileInfo`) authenticate users via `auth.getUser()`.
  * Almost all endpoints terminate in `redirect()` calls to `/login`, `/signup`, `/forgot-password`, `/dashboard`, or `nextPath`.
  * No path revalidation is triggered in this file.

### `automation.ts`
* **Function Signatures**:
  * `saveAutomationSettings(formData: FormData): Promise<{ success: boolean }>`
  * `pauseAutomation(entityType: "client" | "invoice", entityId: string): Promise<void>`
* **Supabase Tables Queried/Modified**:
  * `clients` / `invoices` tables:
    * Selects `last_sent_at, active` from target table.
    * Updates target table with settings (`active: true`, `auto_approve`, `reminder_type`, `reminder_templates`, `reminder_frequency_days`, `next_send_at`, `new_email`, `sequence_index: 0`).
    * If `newEmail` is provided, syncs it by updating associated tables: updates `invoices` setting `recipient_email` where `customer_id` matches, or updates `clients` setting `email` and updates all other `invoices` for that client.
* **Auth, Redirects, and Revalidation**:
  * Authenticates users via `await requireUser()`.
  * Uses rate limiting via `await enforceRateLimit(user.id, "reminder_toggle")`.
  * Does not redirect; returns payload or throws errors.
  * Revalidates: `/customers`, `/invoices`, `/customers/[id]`, `/invoices/[id]`.

### `clients.ts`
* **Function Signatures**:
  * `createClient(formData: FormData): Promise<never>`
* **Supabase Tables Queried/Modified**:
  * Reads `razorpay_subscription_status, razorpay_renews_at, created_at` from `profiles`.
  * Inserts new row into `clients` table: `{ user_id, name, email }`.
* **Auth, Redirects, and Revalidation**:
  * Authenticates via `await requireUser()`.
  * Checks active subscription status. Redirects to `/settings/billing` if inactive.
  * On validation error, redirects to `/customers/new?error=...`.
  * On success, revalidates `/customers` and redirects to `/customers/[id]`.

### `customers.ts`
* **Function Signatures**:
  * `recordPartialPayment(formData: FormData): Promise<never>`
  * `deletePaymentLog(formData: FormData): Promise<never>`
  * `markFullyPaid(formData: FormData): Promise<never>`
  * `undoMarkAsPaid(formData: FormData): Promise<never>`
  * `correctAmountPaid(formData: FormData): Promise<never>`
  * `recordPaymentPromise(formData: FormData): Promise<never>`
  * `saveInternalNotes(formData: FormData): Promise<never>`
  * `updateWorkflowStatus(formData: FormData): Promise<never>`
  * `updateCustomerEmail(formData: FormData): Promise<never>`
  * `createCustomer(formData: FormData): Promise<never>`
  * `enableAutomation(formData: FormData): Promise<never>`
  * `deleteCustomer(formData: FormData): Promise<never>`
  * `updateDueDate(formData: FormData): Promise<never>`
  * `logFollowUp(formData: FormData): Promise<never>`
* **Supabase Tables Queried/Modified**:
  * `invoices` table: Selects, updates, inserts, deletes.
  * `clients` table: Selects (during customer creation/automation enabling), updates (for client email synchronization).
  * `profiles` table: Selects subscription fields during customer creation.
  * `customer_events` table: Inserts events for payment logs (`event_type: "payment"`) and follow-ups (`event_type: "followup"`).
* **Auth, Redirects, and Revalidation**:
  * Authenticates via `await requireUser()`.
  * Uses rate limiting via `enforceRateLimit`.
  * Interacts with external integration sync handlers: `pushPaymentToXero`, `pushPaymentToQuickBooks`.
  * Redirects to `/dashboard`, `/customers/new`, or `/reminders/new` depending on flow.
  * Revalidates: `/`, `/customers`, and specific customer detail sub-routes (e.g. `/customers/[id]`).

### `drafts.ts`
* **Function Signatures**:
  * `approveDraft(draftId: string, overrides?: { subject: string; body_html: string }): Promise<{ success?: boolean, error?: string }>`
  * `updateDraftContent(draftId: string, subject: string, body_html: string): Promise<{ success?: boolean, error?: string }>`
  * `deleteDraft(draftId: string): Promise<{ success?: boolean, error?: string }>`
* **Supabase Tables Queried/Modified**:
  * `email_drafts` table:
    * Selects draft joining with related client details `clients(email, name)`.
    * Checks user session via `auth.getUser()`.
    * Updates draft status to `sent` or `discarded`, setting subject, body, and timestamps.
* **Auth, Redirects, and Revalidation**:
  * Authenticates via `await requireUser()`.
  * Integrates with external sending providers: checks Gmail tokens (`hasGmailTokens`), sends via Gmail API (`sendGmail`) or falls back to Resend API.
  * Returns success/error responses instead of redirecting.
  * Revalidates `/drafts`.

### `feedback.ts`
* **Function Signatures**:
  * `submitFeedback(formData: FormData): Promise<never>`
* **Supabase Tables Queried/Modified**:
  * None.
* **Auth, Redirects, and Revalidation**:
  * Authenticates via `await requireUser()`.
  * Triggers feedback email via `sendFeedbackEmail`.
  * Redirects to `/feedback?error=...` on failure, and `/dashboard?success=...` on success.
  * No path revalidation.

### `integrations.ts`
* **Function Signatures**:
  * `syncXeroNow(): Promise<never>`
  * `disconnectXero(): Promise<never>`
  * `syncQuickBooksNow(): Promise<never>`
  * `disconnectQuickBooks(): Promise<never>`
  * `disconnectGmail(): Promise<never>`
  * `syncIntegrationBackground(provider: 'xero' | 'quickbooks'): Promise<{ success: boolean, message: string }>`
  * `dailyBackgroundSync(): Promise<{ success: boolean, message?: string }>`
* **Supabase Tables Queried/Modified**:
  * `integrations` table: deletes credentials where user and provider match, selects active connections.
  * `profiles` table: updates Google credentials to `null` (uses admin client).
* **Auth, Redirects, and Revalidation**:
  * Authenticates via `await requireUser()`.
  * Triggers external integration actions: `syncXeroInvoicesForUser`, `revokeXeroIntegration`, `syncQuickBooksInvoicesForUser`, `revokeQuickBooksIntegration`.
  * Redirects to `/settings/integrations?error/success=...` for foreground actions. Returns results for background sync.
  * Revalidates: `/dashboard`, `/settings/integrations`, `/customers`, `/pipeline`.

### `late-fees.ts`
* **Function Signatures**:
  * `createLateFeePolicy(formData: FormData): Promise<void>`
  * `updateLateFeePolicy(id: string, formData: FormData): Promise<void>`
  * `toggleLateFeePolicyActive(id: string, active: boolean): Promise<void>`
  * `deleteLateFeePolicy(id: string): Promise<void>`
* **Supabase Tables Queried/Modified**:
  * `late_fee_policies` table: inserts, updates, deletes policy rules.
* **Auth, Redirects, and Revalidation**:
  * Authenticates via `await requireUser()`.
  * No redirects; throws errors on failure.
  * Revalidates `/settings/late-fees`.

### `leads.ts`
* **Function Signatures**:
  * `captureLead(email: string): Promise<void>`
  * `captureLifetimeDealLead(email: string): Promise<{ success: boolean, error?: string }>`
  * `getRemainingLifetimeSpots(): Promise<number>` (cached getter helper using `unstable_cache`)
* **Supabase Tables Queried/Modified**:
  * `leads` table: inserts email (lowercase) or upserts email with `referral_source: 'lifetime_deal'`.
* **Auth, Redirects, and Revalidation**:
  * No authentication checks (public conversion capture).
  * `captureLifetimeDealLead` revalidates `/` layout.
  * No redirects.

### `portal.ts`
* **Function Signatures**:
  * `promiseToPayAction(invoiceId: string, promisedDate: string, token: string): Promise<void>`
* **Supabase Tables Queried/Modified**:
  * `clients` table: selects client by `unsubscribe_token`.
  * `invoices` table: selects invoice matching customer and updates `promised_date` and `workflow_status` to `"promised"`.
  * `customer_events` table: inserts a follow-up event record with outcome `promise_made`.
* **Auth, Redirects, and Revalidation**:
  * Authenticates via public token verification (checking `unsubscribe_token` parameter against client record).
  * Revalidates `/portal/[token]`.
  * No redirects.

### `reminders.ts`
* **Function Signatures**:
  * `createReminder(formData: FormData): Promise<never>`
  * `pauseReminder(reminderId: string): Promise<never>`
  * `resumeReminder(reminderId: string): Promise<never>`
  * `deleteReminder(reminderId: string): Promise<never>`
  * `sendTestReminderEmail(reminderId: string): Promise<never>`
* **Supabase Tables Queried/Modified**:
  * `invoices` table: inserts new automated invoice (in `createReminder`), deletes (in `deleteReminder`), and selects (in `sendTestReminderEmail`).
  * `clients` table: updates `active: false` (in `pauseReminder`), selects `last_sent_at` and updates `active: true, next_send_at` (in `resumeReminder`).
  * `profiles` table: selects subscription status (in `resumeReminder`).
* **Auth, Redirects, and Revalidation**:
  * Authenticates via `await requireUser()`.
  * Uses rate limiting via `enforceRateLimit`.
  * Integrates with `sendReminderEmail` helper.
  * Redirects to `/reminders/new` on validation errors, and to `/dashboard` on completion.
  * Revalidates `/dashboard`.

---

## 2. Mocking and Testing Strategy

### Vitest vs. Custom Test Runner
We recommend using **Vitest** for testing Next.js server actions. 
* **Why Vitest?** Server actions rely heavily on file imports and path aliases (like `@/lib/auth`). Setting up module intercepts in a custom Node test runner is extremely verbose, fragile, and difficult with ESM. Vitest provides native TypeScript execution, ESM-first design, fast performance, and a robust, clean module mocking system (`vi.mock`) out of the box.

### Mocking Next.js Navigation (Redirects)
In Next.js, `redirect()` throws a internal redirect error containing the target URL in a `digest` field. We can mock this behavior so tests can assert redirection URLs correctly:

```typescript
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const error = new Error("NEXT_REDIRECT");
    (error as any).digest = `NEXT_REDIRECT;307;${url};;`;
    throw error;
  }),
}));

// Helper to assert redirect target in tests:
function assertRedirect(fnCall: () => Promise<any>, expectedUrl: string) {
  return expect(fnCall()).rejects.toSatisfy((err: any) => {
    return err.digest && err.digest.includes(expectedUrl);
  });
}
```

### Mocking Next.js Headers & Cache
```typescript
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));
```

### Mocking Supabase Client Builders
We should mock `@/lib/supabase/server` and `@/lib/supabase/admin` to return a mock database client:

```typescript
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockDelete = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  })),
  auth: {
    getUser: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    updateUser: vi.fn(),
    signInWithOAuth: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    admin: {
      listUsers: vi.fn(),
    },
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => mockSupabaseClient),
}));
```

---

## 3. Test Cases Plan (Tiers 1-4)

We organize the actions into 5 major features:
1. **Authentication & Profile Management**
2. **Customer & Pipeline Management**
3. **Automation & Reminders**
4. **Third-party Integrations**
5. **Public Engagement & Marketing**

### Tier 1: Happy Paths (>= 5 per feature)

#### Feature 1: Auth & Profile
1. `signup`: Creates user account with email/password and redirects.
2. `login`: Checks password, logs user in, deletes temporary rate limit cookie, and redirects to dashboard.
3. `logout`: Logs out current session and redirects to `/login`.
4. `updateProfileName`: Updates full name metadata and redirects with success flag.
5. `resetPassword`: Authenticates user session, updates password, signs user out, and redirects to login page.

#### Feature 2: Customer & Pipeline
1. `createClient`: Inserts new client into `clients` table when subscription is active.
2. `createCustomer` (Invoice): Inserts outstanding invoice into `invoices` table.
3. `recordPartialPayment`: Adds payment value to `amount_paid`, changes status to `partial`, and logs transaction.
4. `promiseToPayAction` (Portal): Validates public token, updates `promised_date` on invoice, and adds event.
5. `createLateFeePolicy`: Inserts fee policy configuration details correctly.

#### Feature 3: Automation & Reminders
1. `createReminder`: Successfully schedules new automated invoice reminder with initial `next_send_at`.
2. `saveAutomationSettings`: Commits settings, handles templates JSON, and marks target entity as active.
3. `pauseAutomation`: Sets active to false and clears `next_send_at` scheduling date on target invoice.
4. `approveDraft`: Triggers Gmail/Resend integration and transitions email status to `sent`.
5. `deleteDraft`: Discards draft by updating status column value to `discarded`.

#### Feature 4: Third-party Integrations
1. `syncXeroNow`: Triggers Xero import flow and revalidates dashboard page.
2. `disconnectXero`: Deletes integration mapping row and revokes OAuth tokens.
3. `syncQuickBooksNow`: Triggers QuickBooks sync and handles revalidations.
4. `disconnectQuickBooks`: Deletes QuickBooks integration entry.
5. `disconnectGmail`: Resets Gmail access fields on profiles table to default null values.

#### Feature 5: Public Engagement & Marketing
1. `submitFeedback`: Calls feedback email delivery tool and redirects to dashboard.
2. `captureLead`: Inserts lowercase email address into leads table.
3. `captureLifetimeDealLead`: Inserts deal conversion lead and revalidates home page.
4. `getRemainingLifetimeSpots`: Correctly calculates empty spots by checking lifetime lead records.
5. `submitFeedback`: Handles long feedback message trimming automatically.

---

### Tier 2: Boundary and Corner Cases (>= 5 per feature)

#### Feature 1: Auth & Profile
1. `signup`: Throws mismatch redirect error when password does not match confirmation value.
2. `signup`: Prevents account duplication by checking existing auth emails via admin interface.
3. `login`: Blocks auth requests after 3 failed login attempts using client cookies.
4. `requestPasswordReset`: Rate limits forgot password triggers to 3 times per hour.
5. `resetPassword`: Throws error and redirects when session auth is empty.

#### Feature 2: Customer & Pipeline
1. `createClient`: Redirects client creation to billing screen if profile active subscription is false.
2. `recordPartialPayment`: Prevents payment processing if incoming amount exceeds remaining debt.
3. `recordPartialPayment`: Sets workflow status to `paid` and deactivates automation when payment meets debt exactly.
4. `promiseToPayAction`: Blocks updates and throws Unauthorized if client token doesn't match db record.
5. `deletePaymentLog`: Recalculates remaining invoice debt upward when removing payment records.

#### Feature 3: Automation & Reminders
1. `createReminder`: Prevents creating reminders if active reminder count reaches workspace maximum limit (20).
2. `createReminder`: Fails validator checks if inputs like recipient name, email, or message exceed field limits.
3. `saveAutomationSettings`: Auto-syncs updated email addresses between client file and active invoices.
4. `saveAutomationSettings`: Rejects save action if `reminder_templates` JSON parameter contains syntax errors.
5. `approveDraft`: Auto-routes email via Resend backup client if Gmail API authorization fails.

#### Feature 4: Third-party Integrations
1. `syncXeroNow` / `syncQuickBooksNow`: Catches third-party connection errors and redirects user with error.
2. `dailyBackgroundSync`: Ignores integration processing if last sync date is equal to current calendar date.
3. `dailyBackgroundSync`: Gracefully catches and logs API crashes without aborting execution queue.
4. `syncIntegrationBackground`: Returns structured error responses instead of triggering router redirects on sync failure.
5. `disconnectGmail`: Reverts profile fields using fallback admin client if standard API connection is read-only.

#### Feature 5: Public Engagement & Marketing
1. `submitFeedback`: Blocks feedback submission if message input is completely empty or blank space.
2. `submitFeedback`: Throws character limits error if message input exceeds maximum allowed (2000).
3. `captureLead`: Prevents capture failure bubbles if leads table schema does not exist in target database environment.
4. `captureLifetimeDealLead`: Handles database upsert conflicts cleanly on duplicate email registration.
5. `getRemainingLifetimeSpots`: Standardizes default returns (max capacity) if database counts query fails.

---

### Tier 3: Pairwise Combinations of Major Features

These test cases ensure correct interactions between distinct system modules:

1. **Auth & Pipeline Integration**:
   * *Flow*: Verify that client/invoice creation operations query `requireUser` and correctly associate records with the active session user ID. Checks that updating profile fields does not alter existing invoice relations.
2. **Pipeline & Automation Sync**:
   * *Flow*: Verify that when a user updates customer contact info via `updateCustomerEmail`, the email address is updated across all matching invoices, active automation configurations, and queued email drafts.
3. **Integration Sync & Pipeline Balance**:
   * *Flow*: Verify that third-party sync operations (`syncXeroNow` / `syncQuickBooksNow`) record partial payments, and if the remaining balance is paid, toggle invoice automation active state to false.
4. **Auth Settings & Automation Schedule**:
   * *Flow*: Verify that updating profile timezones (`updateDigestSettings`) changes the calculated send dates for pending automated reminders during scheduling.
5. **Portal Token & Pipeline Update**:
   * *Flow*: Verify that a customer-initiated action on the portal (`promiseToPayAction`) using a public token updates invoice status, logs a timeline event, and triggers page revalidation so the dashboard matches immediately.

---

### Tier 4: Realistic Workload Scenarios (>= 5)

These integrate multiple actions in sequential scenarios:

1. **Scenario 1: User Onboarding, Billing, and Setup**
   * *Sequence*:
     1. User calls `signup` to register.
     2. User logs in via `login`.
     3. User updates setup info via `updateProfileInfo`.
     4. User attempts to create a client via `createClient`, which fails and redirects due to no active subscription.
     5. Profile subscription fields are updated to mock active status.
     6. User successfully calls `createClient` and inserts first customer invoice via `createCustomer`.
2. **Scenario 2: Delinquent Invoice Collection Lifecycle**
   * *Sequence*:
     1. Invoice status is set to `overdue`.
     2. Merchant contacts the customer and logs a phone call follow-up via `logFollowUp`.
     3. Merchant updates the invoice promise date via `recordPaymentPromise`.
     4. Customer pays part of the balance; merchant logs a partial payment via `recordPartialPayment`.
     5. Verification check: Remaining debt is recalculated, status changes from `promised` to `partial`, and event log is written.
3. **Scenario 3: Automated Reminder Review, Edit, and Dispatch**
   * *Sequence*:
     1. Merchant configures automation parameters via `saveAutomationSettings`.
     2. Background cron creates a draft reminder in `email_drafts`.
     3. Merchant views draft and updates content via `updateDraftContent`.
     4. Merchant clicks approve, invoking `approveDraft`, which sends email via integration and sets status to `sent`.
4. **Scenario 4: ERP Invoice Import & Automated Shut-off**
   * *Sequence*:
     1. Merchant connects QuickBooks integration.
     2. Merchant runs sync via `syncQuickBooksNow` to import invoices.
     3. Automation rules are configured.
     4. Customer pays the merchant directly through their QuickBooks invoice.
     5. Next background sync triggers `syncIntegrationBackground`.
     6. Verification check: System updates invoice status to `paid` and sets `active: false` on the reminder to prevent sending emails for paid invoices.
5. **Scenario 5: Customer Portal Self-Service Engagement**
   * *Sequence*:
     1. Customer receives a automated reminder email containing their unsubscribe token.
     2. Customer opens portal, invoking `promiseToPayAction` with the token.
     3. Verification check: System verifies unsubscribe token matches client, updates `promised_date` on the invoice, changes status to `promised`, writes timeline event, and triggers `revalidatePath` so the merchant sees the promise immediately on their dashboard.
