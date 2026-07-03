# Original User Request

## Initial Request — 2026-07-02T18:38:28+05:30

# Teamwork Project Prompt

Refactor 11 Next.js server actions in the `app/actions/` directory to migrate from a legacy single-tenant schema to a new multi-tenant (organization-based) Supabase schema, utilizing strict ENUM types.

Working directory: /media/shad0w/Data1/Abhi_Data/Data/Programming_II/Projects/email_reminder/nudge

Integrity mode: development

## Requirements

### R1. Database Query Migration
Refactor all Supabase queries inside `app/actions/` to query the new normalized tables (`organizations`, `clients`, `invoices`, `events`, `payments`) instead of the deprecated `customers` table.

### R2. Context Shift (Multi-tenant)
Rewrite data-authorization logic to ensure records are filtered and inserted using `organization_id` (via the user's membership) rather than the legacy `user_id` mapping. 

### R3. Strict Type Alignment
Replace any free-text status strings (like `"outstanding"` or `"paid"`) with the newly generated TypeScript ENUMs exported from `lib/types.ts`. Do not modify any frontend `.tsx` components; focus strictly on the backend actions.

## Acceptance Criteria

### Type Safety & Verification
- [ ] Running `npx tsc --noEmit` exits with status code 0, confirming the backend successfully aligns with the new schema types.
- [ ] No file in `app/actions/` contains queries selecting from or inserting into the `customers` table.
- [ ] No file in `app/actions/` relies on `auth.uid() = user_id` for row-level mapping (must use `organization_id`).

## 2026-07-03T09:12:06Z

The backend was recently migrated to a multi-tenant schema using `organization_id` instead of `user_id`. The actions and backend functions have been updated. However, the frontend pages in `app/(app)` are still querying tables like `invoices`, `clients`, `customer_events`, `groups`, `email_drafts`, `late_fee_policies` using `.eq("user_id", user.id)`. 

Since RLS is enabled and handles scoping by `organization_id` automatically via the user's JWT, you must REMOVE all `.eq("user_id", user.id)` filters from queries for these tables in all files within `app/(app)/**/*.tsx`. 
IMPORTANT: DO NOT remove `.eq("user_id", user.id)` for queries to `profiles`, `integrations`, or `organization_members` as those still rely on user_id.
IMPORTANT: Do not use `sed`. Make precise file modifications.

After removing them, run `npx tsc --noEmit` to ensure you haven't broken any types, and report back when finished.
