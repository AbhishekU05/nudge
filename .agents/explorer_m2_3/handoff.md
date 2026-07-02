# Handoff Report - Codebase Explorer 3

## 1. Observation
- In `app/actions/auth.ts`:
  - `updateDigestSettings` and `updateProfileInfo` query the `profiles` table:
    - Line 391-394: `const { error } = await supabase.from("profiles").update({ timezone, weekly_digest_enabled }).eq("user_id", user.id);`
    - Line 415-418: `const { error } = await supabase.from("profiles").update({ first_name, last_name, company_name }).eq("user_id", user.id);`
  - In `supabase/schema.sql`:
    - `profiles` table is defined as:
      ```sql
      CREATE TABLE profiles (
        user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        full_name TEXT,
        google_access_token TEXT,
        google_refresh_token TEXT,
        gmail_connected_email TEXT,
        timezone TEXT DEFAULT 'UTC',
        weekly_digest_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      ```
    - `organizations` table is defined on line 13.
    - `organization_members` table is defined on line 27.
- In `app/actions/feedback.ts`:
  - `submitFeedback` does not query any database tables, but calls `sendFeedbackEmail` (line 25).
- In `app/actions/leads.ts`:
  - `captureLifetimeDealLead` (line 20) inserts `referral_source: 'lifetime_deal'` into `leads`.
  - `getRemainingLifetimeSpots` (line 44) queries `referral_source` using `.eq('referral_source', 'lifetime_deal')`.
  - In `supabase/schema.sql` (line 132), the `leads` table does not contain a `referral_source` column.

## 2. Logic Chain
- **Step 1**: The B2B multi-tenant schema migration requires checking organization membership. Fetching the active membership via `.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1).maybeSingle()` is necessary for checking auth/context.
- **Step 2**: Based on the schema definitions in `schema.sql`, `profiles` does not contain `first_name`, `last_name`, or `company_name`.
- **Step 3**: Therefore, the profile update action in `auth.ts` must split updates:
  - Combine `first_name` and `last_name` into `full_name` and write to `profiles.full_name`.
  - Use `organization_id` to update the company name in `organizations.name`.
- **Step 4**: Since there are no public `INSERT` policies for `organizations` or `organization_members` in `schema.sql`, provisioning a new organization for new signups must happen server-side via the admin client (`createSupabaseAdminClient()`) during auth callback or signup verification.
- **Step 5**: Because `leads` has a missing column `referral_source` in `schema.sql` that is required by `app/actions/leads.ts`, a database schema migration is necessary to add this column.

## 3. Caveats
- We assumed that users will only belong to one active organization at a time for settings updates. If multi-organization support is required, active tenant IDs must be managed via cookies or session state.
- No direct implementation was carried out since the role is read-only exploration.

## 4. Conclusion
The refactoring strategy must be executed as follows:
- Retrieve `organization_id` using `organization_members` for authentication/settings updates.
- Refactor `updateProfileInfo` to update `full_name` in `profiles` and `name` in `organizations`.
- Enhance feedback actions by appending organization context to emails.
- Add `referral_source` to the `leads` table database schema.

## 5. Verification Method
- **Analysis File**: Inspect findings in `/media/shad0w/Data1/Abhi_Data/Data/Programming_II/Projects/email_reminder/nudge/.agents/explorer_m2_3/analysis.md`.
- **Compile Check**: Run `npx tsc --noEmit` after code changes.
- **Tests**: Run E2E tests using `npm run test` to verify behavior.
