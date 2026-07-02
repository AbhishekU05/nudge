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
