# Project: Next.js Multi-Tenant Server Actions Migration

## Architecture
This project refactors 11 legacy server actions located in `app/actions/` to conform to a new multi-tenant (organization-based) Supabase database schema, using strict TypeScript ENUMs from `lib/types.ts`. All frontend components (.tsx) are kept intact. The actions handle:
- **Authentication & Settings**: Profile updates, digests, resets.
- **Client & Integration Management**: Adding/updating clients, portal settings, accounting integrations.
- **Invoice & Payment Processing**: Recording payments, payment promises, manual reminders, events timeline.
- **Leads & Feedback**: Capturing public leads and user feedback.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Test Suite Development | Create test framework and coverage cases (Tiers 1-4) | None | IN_PROGRESS (Conv: c33f25ab-14dc-4fda-ac1f-1e9b6cfd95a9) |
| 2 | Auth & Settings Migration | Refactor `app/actions/auth.ts`, `feedback.ts`, `leads.ts` | None | IN_PROGRESS (Conv: 6c7dab8a-4707-4f28-9d1c-338d0473625d) |
| 3 | Clients & Portal Migration | Refactor `app/actions/clients.ts`, `portal.ts`, `integrations.ts` | M2 | PLANNED |
| 4 | Invoices & Payments Migration | Refactor `app/actions/customers.ts` (invoices workflow), `reminders.ts` | M3 | PLANNED |
| 5 | Automation & Policies Migration | Refactor `app/actions/automation.ts`, `drafts.ts`, `late-fees.ts` | M4 | PLANNED |
| 6 | E2E & Type-safety Verification | Verification of all 11 actions passing E2E tests and `tsc --noEmit` | M1, M5 | PLANNED |

## Interface Contracts
- **Supabase client context**: All actions must fetch the current authenticated user via `requireUser()` and retrieve their `organization_id` from the `organization_members` table.
- **Table mappings**:
  - Legacy `customers` table queries must be migrated to `clients` and `invoices` tables.
  - Queries must use `.eq("organization_id", organizationId)` instead of `.eq("user_id", userId)`.
- **Status ENUMs**: All free-text strings for statuses (invoice, subscription, event type, etc.) must be replaced with strict TypeScript ENUM values exported from `lib/types.ts`.

## Code Layout
- Server Actions: `app/actions/`
- TypeScript types: `lib/types.ts`
- Supabase clients: `lib/supabase/`
- Verification/E2E Tests: `tests/`
