# Scope: Auth & Settings Migration

## Architecture
- Refactor `app/actions/auth.ts`, `app/actions/feedback.ts`, and `app/actions/leads.ts`.
- Retrieve user's `organization_id` from `organization_members` table after obtaining `user_id` from the authenticated user.
- Ensure all queries, inserts, and data-authorization in these files are filtered or populated using `organization_id` instead of `user_id`.
- Import strict ENUM types from `lib/types.ts` instead of free-text status strings.
- Verify changes compile successfully via `npx tsc --noEmit`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Explore & Plan | Find files, read code, inspect schema/types | None | IN_PROGRESS |
| 2 | Refactor Server Actions | Refactor auth.ts, feedback.ts, leads.ts | M1 | PLANNED |
| 3 | Verification | Compile verify via `npx tsc --noEmit` and run tests | M2 | PLANNED |

## Interface Contracts
- Must retrieve authenticated user, then fetch `organization_id` from `organization_members` table:
  ```typescript
  // e.g.
  // const user = await requireUser();
  // const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
  ```
- Use strict ENUM types from `lib/types.ts` for statuses.
- No modifications to frontend `.tsx` components.
