# Handoff Report: Milestone 2 Server Actions Migration Analysis

## 1. Observation
- In `supabase/schema.sql`, the `profiles` table is defined as:
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
  And `leads` table is defined as:
  ```sql
  CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- In `app/actions/auth.ts` (lines 411-418), `updateProfileInfo` attempts to update `first_name`, `last_name`, and `company_name` directly on the `profiles` table:
  ```typescript
  const first_name = formData.get("first_name") as string || null;
  const last_name = formData.get("last_name") as string || null;
  const company_name = formData.get("company_name") as string || null;

  const { error } = await supabase
    .from("profiles")
    .update({ first_name, last_name, company_name })
    .eq("user_id", user.id);
  ```
- In `app/actions/leads.ts` (lines 24-27, 53), `captureLifetimeDealLead` and `getRemainingLifetimeSpots` filter/insert using the `referral_source` field:
  ```typescript
  const { error } = await supabase.from("leads").upsert([{ 
    email: email.toLowerCase(),
    referral_source: 'lifetime_deal'
  }], { onConflict: 'email' });
  ```
- In `lib/types.ts` (lines 1-7), strict string union types are exported:
  ```typescript
  export type SubscriptionStatus = 'pending' | 'active' | 'on_hold' | 'paused' | 'canceled' | 'failed' | 'past_due' | 'expired';
  export type OrgMemberRole = 'owner' | 'admin' | 'member';
  export type InvoiceStatus = 'outstanding' | 'promised' | 'partial' | 'paid' | 'overdue' | 'written_off';
  export type CrmEventType = 'followup' | 'note' | 'reminder_sent' | 'status_change' | 'late_fee_applied';
  export type IntegrationProvider = 'xero' | 'quickbooks';
  export type SyncDirection = 'bidirectional' | 'import_only' | 'export_only';
  export type PricingPlanType = 'monthly' | 'annual' | 'base_usage';
  ```

## 2. Logic Chain
- **Step 1**: The new database schema (`supabase/schema.sql`) represents a B2B multi-tenant setup where tables such as `organizations` and `organization_members` exist, but no application code queries them yet.
- **Step 2**: The legacy `profiles` table does not contain `first_name`, `last_name`, or `company_name`. Therefore, updating these columns will throw runtime database errors. Under B2B multi-tenancy, `first_name` and `last_name` must be combined to populate `profiles.full_name`, and `company_name` must update `organizations.name` for the user's organization.
- **Step 3**: To update `organizations.name`, the application must retrieve `organization_id` from the `organization_members` table matching the authenticated user's ID (`user.id`).
- **Step 4**: The `leads` table does not possess an `organization_id` or `user_id` and has public insert policies. Therefore, leads are pre-auth and tenancy filtering does not apply.
- **Step 5**: However, the `leads` table schema is missing the `referral_source` column used in `leads.ts`, which represents a database schema mismatch that must be rectified.
- **Step 6**: To register users successfully under B2B tenancy during `signup`, we must create a default organization and insert the user as the `'owner'` of the workspace (typed via `OrgMemberRole` from `lib/types.ts`). Since the user is not yet fully authenticated at the time RLS check executes, these inserts must bypass RLS using the admin client.

## 3. Caveats
- Assumes every user has exactly one organization membership. If a user can belong to multiple organizations, a default workspace or switcher mechanism must be introduced in a future milestone.
- The `referral_source` column discrepancy on the `leads` table is outside the server actions file changes but will block compile/runtime verification of `leads.ts` until SQL schema is updated.

## 4. Conclusion
We have developed a comprehensive refactoring strategy mapping out the exact changes for `auth.ts`, `feedback.ts`, and `leads.ts`. The actions can be safely migrated to B2B multi-tenancy by querying `organization_members` to resolve the `organization_id`, aligning `profiles` updates with the schema (using `full_name` and moving `company_name` to `organizations`), and using explicit TypeScript casts for roles and plan statuses.

## 5. Verification Method
1. Ensure the database schema matches `supabase/schema.sql` and that `referral_source TEXT` has been added to the `leads` table.
2. Implement the refactored code matching the proposals in `analysis.md`.
3. Verify type-safety and successful compilation using:
   ```bash
   npx tsc --noEmit
   ```
