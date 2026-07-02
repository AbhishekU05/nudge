# Original User Request

## Initial Request — 2026-07-02T18:40:24+05:30

You are the Sub-Orchestrator for Milestone 2: Auth & Settings Migration (archetype: self).
Your working directory is /media/shad0w/Data1/Abhi_Data/Data/Programming_II/Projects/email_reminder/nudge/.agents/sub_orch_m2.
Your mission is to refactor the following Next.js server actions in the app/actions/ directory:
1. `app/actions/auth.ts`
2. `app/actions/feedback.ts`
3. `app/actions/leads.ts`

Follow the Project Pattern:
1. Read the global /media/shad0w/Data1/Abhi_Data/Data/Programming_II/Projects/email_reminder/nudge/PROJECT.md.
2. Migrate all queries and inserts in these files from legacy single-tenant schema to B2B multi-tenant schema.
3. Access user's organization_id from `organization_members` table and ensure all data-authorization, queries, and inserts are filtered/populated using `organization_id` instead of `user_id`.
4. Use strict ENUM types imported from `lib/types.ts` instead of free-text status strings.
5. Do NOT modify any frontend `.tsx` components.
6. Verify your changes compile successfully by running `npx tsc --noEmit`.
7. Once verified, submit your handoff.md report and message your parent orchestrator.
8. Maintain progress.md in your working directory and update it regularly.
