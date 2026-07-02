## 2026-07-02T13:14:09Z

You are the Milestone 2 Implementer.
Your working directory is /media/shad0w/Data1/Abhi_Data/Data/Programming_II/Projects/email_reminder/nudge/.agents/worker_m2_1.

Your mission:
Refactor the Next.js server actions in:
1. `app/actions/auth.ts`
2. `app/actions/feedback.ts`
3. `app/actions/leads.ts`

Follow these details for migration from legacy single-tenant schema to B2B multi-tenant schema:

1. In `app/actions/auth.ts`:
   - Retrieve organization membership information securely.
   - Refactor the `signup` action to provision organizations:
     - After registering the user via `signUp`, parse the user's email domain.
     - Filter out common personal domains: `gmail.com`, `yahoo.com`, `hotmail.com`, `outlook.com`, `icloud.com`, `aol.com`.
     - If the domain is non-personal, check if an organization with the same domain already exists in the `organizations` table.
     - If it exists, create an entry in `organization_members` with role `'member'` (using `OrgMemberRole` cast/enum from `lib/types.ts`).
     - If it does not exist, provision a new organization in `organizations` with name `${fullName}'s Workspace` and the parsed domain. Then, create an entry in `organization_members` with role `'owner'`.
     - Since the user might not have a session yet or RLS restrictions apply, use the admin client (`createSupabaseAdminClient()`) to perform these organization/member insertions.
   - Refactor `updateProfileInfo`:
     - Combine `first_name` and `last_name` into `full_name` and update the `profiles` table.
     - Retrieve the user's `organization_id` from the `organization_members` table.
     - If `company_name` is provided, update the corresponding organization's `name` in the `organizations` table.
   - Refactor `updateProfileName`:
     - In addition to updating the user's Auth metadata, write the new name back to `profiles.full_name`.
   - Refactor `updateDigestSettings`:
     - Update settings in `profiles` and ensure compilation is correct.

2. In `app/actions/feedback.ts`:
   - Refactor `submitFeedback` to retrieve the user's `organization_id` from `organization_members`.
   - Query the `organizations` table to get the organization name.
   - Append the organization name and ID to the feedback message body so support emails have tenant context.

3. In `app/actions/leads.ts`:
   - Leads actions remain globally scoped and must NOT be filtered by `organization_id`.
   - Verify that all leads actions compile cleanly.
   - Wait, if `leads` or `profiles` tables in the database are missing the `referral_source` column used in `leads.ts` / `callback/route.ts`, run an SQL query or migration to add it:
     ```sql
     ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_source TEXT;
     ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_source TEXT;
     ```
     You can check if these columns exist and add them if needed to ensure the system compiles and works.

4. Type-safety & Compilation Verification:
   - Ensure all database roles, plan types, and statuses use strict types/enums from `lib/types.ts` (e.g. `OrgMemberRole` for roles, `SubscriptionStatus` for billing status).
   - Verify your changes compile successfully by running `npx tsc --noEmit` on the codebase. Fix any compiler issues.
   - Do NOT modify any frontend `.tsx` components.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Once completed, write a detailed handoff.md report in your working directory and send a message to your parent orchestrator with the results and file paths.
