# Handoff Report - explorer_m2_2

## 1. Observation
We analyzed the following files:
* **`app/actions/auth.ts`**:
  * Line 417-418: updates profiles table using `first_name`, `last_name`, and `company_name`:
    ```typescript
    const { error } = await supabase
      .from("profiles")
      .update({ first_name, last_name, company_name })
      .eq("user_id", user.id);
    ```
* **`app/actions/feedback.ts`**:
  * Line 25-28: calls `sendFeedbackEmail` without passing any organization context:
    ```typescript
    await sendFeedbackEmail({
      userEmail: user.email ?? "unknown@user.com",
      message: message.trim(),
    });
    ```
* **`app/actions/leads.ts`**:
  * Line 24-27: upserts to `leads` with `referral_source`:
    ```typescript
    const { error } = await supabase.from("leads").upsert([{ 
      email: email.toLowerCase(),
      referral_source: 'lifetime_deal'
    }], { onConflict: 'email' });
    ```
* **`lib/types.ts`**:
  * Line 29-39: `Profile` structure has `full_name`, but lacks `first_name`, `last_name`, and `company_name`:
    ```typescript
    export interface Profile {
      user_id: string;
      full_name: string | null;
      google_access_token: string | null;
      google_refresh_token: string | null;
      gmail_connected_email: string | null;
      timezone: string;
      weekly_digest_enabled: boolean;
      created_at: string;
      updated_at: string;
    }
    ```
* **`supabase/schema.sql`**:
  * Line 36-46: `profiles` table has `full_name TEXT`, but no `first_name`, `last_name`, `company_name` or `referral_source` columns.
  * Line 132-136: `leads` table does not contain a `referral_source` column.

---

## 2. Logic Chain
1. Since the `profiles` table does not contain `first_name`, `last_name`, or `company_name` (per `lib/types.ts` and `supabase/schema.sql`), calling `updateProfileInfo` as currently written will cause compilation and runtime errors.
2. In the new B2B multi-tenant schema, the organization represents the company context, which corresponds to `company_name`.
3. Therefore, `updateProfileInfo` must be refactored to:
   - Combine `first_name` and `last_name` into `profiles.full_name`.
   - Retrieve `organization_id` using the user's ID via `organization_members`.
   - Update `organizations.name` with `company_name` using `organization_id`.
4. In `signup` action of `auth.ts`, to guarantee every registered user is correctly associated with an organization in B2B schema:
   - Extract user email domain.
   - Run domain auto-join checks against `organizations.domain` (skipping common public domains).
   - If match found, link to existing organization in `organization_members` as `'member'`.
   - If not found, provision a new organization and link as `'owner'`.
5. Feedback action must resolve user organization context via `organization_members` to enrich support email context.
6. Leads actions do not authenticate users (public landing page captures) and therefore cannot filter by `organization_id`.
7. Database migrations must add missing `referral_source TEXT` columns to `leads` and `profiles` tables to align schema with code.

---

## 3. Caveats
- Assumes that domain auto-join logic is desired directly on server-side signup flow. If organization onboarding has its own dedicated wizard frontend route, signups might instead create a default shell organization that is later updated.
- Bypassing organization filtering in public lead capture actions is required due to the anonymous nature of landing page visitors.

---

## 4. Conclusion
We successfully formulated a comprehensive, non-breaking refactoring strategy to migrate `auth.ts`, `feedback.ts`, and `leads.ts` to the B2B multi-tenant schema. The strategy resolves all schema mismatches (e.g. `first_name`, `last_name`, `company_name`, and `referral_source` fields) and integrates strict union type-safety checks from `lib/types.ts`.

---

## 5. Verification Method
- Code compilation verification command: `npx tsc --noEmit`
- The proposed changes can be found in the report at:
  `/media/shad0w/Data1/Abhi_Data/Data/Programming_II/Projects/email_reminder/nudge/.agents/explorer_m2_2/analysis.md`
