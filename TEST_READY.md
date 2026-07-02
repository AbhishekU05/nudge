# E2E Test Suite Status: READY

The end-to-end testing track infrastructure, mock environment, and comprehensive test suite for Next.js server actions are fully implemented and ready.

## How to Run the Tests
Run the following command from the project root:
```bash
npm run test:e2e
```
This script will:
1. Compile the TypeScript source code and test files to CommonJS in the `dist-tests` directory.
2. Launch the custom test runner (`tests/runner.js`), which overrides module resolution to mock Next.js headers/cookies/navigation/cache, Supabase server/admin clients, and third-party integrations (Gmail, Resend, Xero, QuickBooks).
3. Execute the 7 test suites sequentially and output a summary of test results.

---

## Test Coverage Summary

### Tested Server Actions (`app/actions/`)
1. `auth.ts`
2. `clients.ts`
3. `portal.ts`
4. `late-fees.ts`
5. `customers.ts`
6. `automation.ts`
7. `reminders.ts`
8. `drafts.ts`
9. `integrations.ts`
10. `feedback.ts`
11. `leads.ts`

### Test Distribution by Tier
| Tier | Description | Count |
|:---:|-------------|:---:|
| **Tier 1** | Happy paths (>=5 per feature) | 33 |
| **Tier 2** | Boundary, error, and corner cases (>=5 per feature) | 31 |
| **Tier 3** | Pairwise combinations of major features | 5 |
| **Tier 4** | Realistic workloads (End-to-End, Multi-Tenant, Subscription expiration, DB Fault Recovery) | 5 |
| **Total** | **All Tiers** | **74** |

---

## Test Inventory

### Feature 1: Auth & Profile (`tests/feature1_auth.test.ts`)
- **Happy Paths**:
  - H1: Sign up new user and redirect to login success page.
  - H2: Log in existing user and redirect to next path.
  - H3: Log out user and redirect to login page.
  - H4: Update profile name and redirect with success.
  - H5: Request password reset and redirect.
  - H6: Reset password successfully if user is verified.
  - H7: Update weekly digest settings successfully.
  - H8: Update profile info details successfully.
- **Boundary/Error Paths**:
  - E1: Signup fails if passwords do not match.
  - E2: Signup fails if email format is invalid.
  - E3: Signup fails if password is too short (< 8 chars).
  - E4: Signup fails if user already exists.
  - E5: Login fails if email format is invalid.
  - E6: Login throttled if too many failed attempts.
  - E7: Update profile name fails if name is longer than 100 characters.
  - E8: Reset password fails if user is not authenticated.
  - E9: Update profile info fails if user is not logged in.

### Feature 2: Customer & Pipeline (`tests/feature2_customer.test.ts`)
- **Happy Paths**:
  - H1: Create client if subscriber is active.
  - H2: Register promise to pay on client portal.
  - H3: Create late fee policy.
  - H4: Create new customer invoice.
  - H5: Record partial payment and log event.
  - H6: Update/save internal customer notes.
- **Boundary/Error Paths**:
  - E1: Create client fails if user has no active subscription.
  - E2: Create client fails if name is missing.
  - E3: Create late fee policy fails if rate is negative.
  - E4: Create customer fails if amount_due is zero or negative.
  - E5: Delete customer redirects with error if not found.

### Feature 3: Automation & Reminders (`tests/feature3_automation.test.ts`)
- **Happy Paths**:
  - H1: Save automation settings.
  - H2: Pause automation for a client.
  - H3: Create new reminder (invoice).
  - H4: Pause and resume active reminder.
  - H5: Delete reminder.
  - H6: Update draft content and approve draft email via Resend.
- **Boundary/Error Paths**:
  - E1: Create reminder fails if recipient email is invalid.
  - E2: Create reminder fails if amount owed is invalid.
  - E3: Create reminder fails if frequency is negative.
  - E4: Approve draft fails if draft not found.
  - E5: Update draft content fails if draft does not exist.

### Feature 4: Third-party Integrations (`tests/feature4_integrations.test.ts`)
- **Happy Paths**:
  - H1: Sync Xero now and redirect with success.
  - H2: Disconnect Xero and delete integration from DB.
  - H3: Sync QuickBooks now and redirect with success.
  - H4: Disconnect QuickBooks and delete integration.
  - H5: Disconnect Gmail and reset google tokens in profile.
  - H6: Sync integration in the background.
  - H7: Daily background sync for stale integrations.
- **Boundary/Error Paths**:
  - E1: Sync Xero now redirects with error if SDK throws.
  - E2: Disconnect Xero redirects with error if DB delete fails.
  - E3: Sync QuickBooks redirects with error if SDK throws.
  - E4: Disconnect QuickBooks redirects with error if DB delete fails.
  - E5: Disconnect Gmail redirects with error if DB update fails.
  - E6: Sync integration background returns failure message if sync throws.
  - E7: Daily background sync returns false response if no integrations exist.

### Feature 5: Public Engagement & Marketing (`tests/feature5_marketing.test.ts`)
- **Happy Paths**:
  - H1: Submit feedback and redirect with success.
  - H2: Capture public lead.
  - H3: Capture lifetime deal lead and revalidate layout.
  - H4: Return max spots (10) when no lifetime leads exist.
  - H5: Calculate correct remaining spots when some exist.
- **Boundary/Error Paths**:
  - E1: Submit feedback fails if message is empty.
  - E2: Submit feedback fails if message too long.
  - E3: Submit feedback redirects with error if email sending throws.
  - E4: Capture lead silently catches/ignores DB errors.
  - E5: Capture lifetime deal lead returns failure if DB errors out.
  - E6: Remaining spots returns max spots if DB errors out.

### Pairwise Feature Combinations (`tests/tier3_pairwise.test.ts`)
- P1: Auth & Pipeline (signup -> active profile -> create client)
- P2: Pipeline & Automation (create client -> configure workspace settings -> pause client automation)
- P3: Pipeline & Reminders (create customer invoice -> schedule custom reminder)
- P4: Third-party & Pipeline (connect Xero -> sync invoices -> pay synced invoice)
- P5: Marketing & Auth (lifetime lead capture -> signup with same email -> check referral)

### Realistic Workload Scenarios (`tests/tier4_workload.test.ts`)
- W1: E2E Invoice Lifecycle (Create client -> create invoice -> generate draft -> edit draft -> approve draft -> record partial payment -> mark fully paid).
- W2: Multi-Tenant Data Isolation (Tenant A and Tenant B data separation test).
- W3: Daily Background Sync and Automation run.
- W4: Subscription Trial Expiration (expired trial blocks actions, subscription webhook clears block, actions succeed).
- W5: Database Error Recovery (DB connection timeout is handled gracefully, retry succeeds after DB recovery).
