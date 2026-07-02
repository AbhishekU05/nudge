## 2026-07-02T13:13:13Z
You are teamwork_preview_worker. Your working directory is /media/shad0w/Data1/Abhi_Data/Data/Programming_II/Projects/email_reminder/nudge/.agents/teamwork_preview_worker_e2e_1.

Your task is to implement the E2E Testing Track infrastructure, test runner, mock environment, and comprehensive test suite for Next.js server actions.

Follow these steps:
1. Try to install `vitest` as a devDependency using `npm install --save-dev vitest`. If it succeeds, we will use Vitest. If it fails (due to lack of internet/network issues), implement a custom test runner in TypeScript/JavaScript utilizing Node's built-in test runner (`node --import tsx --test` or similar) or a simple script that executes all tests and checks assertions.
2. Create `TEST_INFRA.md` at the project root based on the following template:
```markdown
# E2E Test Infra: Next.js Multi-Tenant Server Actions

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Auth & Profile | ORIGINAL_REQUEST §R1-3 | 5 | 5 | ✓ |
| 2 | Customer & Pipeline | ORIGINAL_REQUEST §R1-3 | 5 | 5 | ✓ |
| 3 | Automation & Reminders | ORIGINAL_REQUEST §R1-3 | 5 | 5 | ✓ |
| 4 | Third-party Integrations | ORIGINAL_REQUEST §R1-3 | 5 | 5 | ✓ |
| 5 | Public Engagement & Marketing | ORIGINAL_REQUEST §R1-3 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Vitest (or custom Node test runner)
- Mock environment: Mocking Next.js headers/cookies, navigation (redirects), cache (revalidatePath), and Supabase server/admin clients.
- Directory layout: `tests/`
```
3. Create the mock environment in `tests/mocks/` to mock:
   - Next.js `cookies()`, `revalidatePath()`, and `redirect()` (ensure `redirect` throws the correct NEXT_REDIRECT error so it can be caught and asserted).
   - Supabase server client and admin client builder functions. The mock Supabase client should track all table operations (.from(), .eq(), .insert(), .select(), etc.) and allow configureable returns.
4. Implement the test suite in `tests/` for all 11 server actions in `app/actions/`, covering Tiers 1-4:
   - Feature 1: Auth & Profile (`app/actions/auth.ts`)
   - Feature 2: Customer & Pipeline (`app/actions/clients.ts`, `app/actions/portal.ts`, `app/actions/late-fees.ts`, `app/actions/customers.ts`)
   - Feature 3: Automation & Reminders (`app/actions/automation.ts`, `app/actions/reminders.ts`, `app/actions/drafts.ts`)
   - Feature 4: Third-party Integrations (`app/actions/integrations.ts`)
   - Feature 5: Public Engagement & Marketing (`app/actions/feedback.ts`, `app/actions/leads.ts`)
   Ensure you cover:
   - Tier 1: Happy paths (>=5 per feature)
   - Tier 2: Boundary/error/corner cases (>=5 per feature)
   - Tier 3: Pairwise combinations of major features (e.g. Auth & Pipeline, Pipeline & Automation, etc. - 5 cases)
   - Tier 4: Realistic workload scenarios (5 cases)
   Total tests: >= 60 cases.
5. Run the test suite using your runner to verify that it executes successfully. Fix any bugs in the mock/test implementation if they fail on the current code.
6. Publish `TEST_READY.md` at the project root with the required coverage summary.
7. Document your work in /media/shad0w/Data1/Abhi_Data/Data/Programming_II/Projects/email_reminder/nudge/.agents/teamwork_preview_worker_e2e_1/handoff.md.
8. Send a message back to the E2E Testing Track Orchestrator (conversation ID: c33f25ab-14dc-4fda-ac1f-1e9b6cfd95a9) when complete.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
