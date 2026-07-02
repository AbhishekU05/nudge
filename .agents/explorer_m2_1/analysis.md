# Analysis: B2B Multi-Tenant Server Actions Migration (Milestone 2)

## Executive Summary
This report details the exploration, findings, and a concrete refactoring strategy for migrating three server actions (`auth.ts`, `feedback.ts`, and `leads.ts`) from a legacy single-tenant schema to the new B2B multi-tenant schema as defined in `supabase/schema.sql`.

Key outcomes of the analysis:
1. **Schema Mismatches**: Identified that the legacy `profiles` table is missing `first_name`, `last_name`, and `company_name` columns. The `leads` table is missing the `referral_source` column used by the application.
2. **Tenant Resolution**: Shared helper functions must be designed to fetch the `organization_id` from the `organization_members` table using the user's ID for all authenticated actions.
3. **Strict Type Safety**: Mapped out the precise usage of strict TypeScript types (`OrgMemberRole`, `SubscriptionStatus`, `PricingPlanType`) from `lib/types.ts`.

---

## 1. Action-by-Action Analysis

### 1.1. `app/actions/auth.ts`
* **Current State**:
  * `updateDigestSettings` directly updates the `profiles` table using `.eq("user_id", user.id)`.
  * `updateProfileInfo` attempts to update `first_name`, `last_name`, and `company_name` directly on the `profiles` table.
  * `signup` handles new user registration but does not create an organization or membership association.
  * `updateProfileName` updates user metadata in Auth but does not write to the `profiles` table.
* **Database & Type Requirements**:
  * The `profiles` table in `supabase/schema.sql` only has `user_id` and `full_name`.
  * `company_name` belongs to the `organizations.name` field.
  * `organization_members` maps `user_id` to `organization_id` with a role.
* **Proposed Migration**:
  1. **User Sign Up**: Use `createSupabaseAdminClient()` during registration to bypass RLS and create an organization (`organizations`) and a membership (`organization_members`) with role `'owner'`.
  2. **Profile Settings Update**: Retrieve the user's `organization_id` from `organization_members`. Combine `first_name` and `last_name` to update `profiles.full_name`. Update the organization's name in `organizations` using the retrieved `organization_id`.

### 1.2. `app/actions/feedback.ts`
* **Current State**:
  * `submitFeedback` retrieves the authenticated user and sends their feedback email using `sendFeedbackEmail`. It contains no tenant/organization context.
* **Database & Type Requirements**:
  * The application can retrieve the user's membership and organization details to enrich the feedback message for the support team.
* **Proposed Migration**:
  * Query the `organization_members` table for the user's `organization_id`.
  * Query `organizations.name` for the organization name.
  * Append organization ID and organization name to the feedback payload or email body to provide multi-tenant context.

### 1.3. `app/actions/leads.ts`
* **Current State**:
  * `captureLead` and `captureLifetimeDealLead` perform public/admin operations on the `leads` table.
  * `getRemainingLifetimeSpots` reads spots left by filtering `leads` by `referral_source`.
* **Database & Type Requirements**:
  * In `supabase/schema.sql`, `leads` does not contain `organization_id` or `user_id` and has RLS allowing anyone to insert. Thus, leads are pre-authentication and do not belong to organizations.
* **Proposed Migration**:
  * Keep the current logic as-is regarding tenancy (no `organization_id` filtering).
  * Critically, correct the database schema definition to include the missing `referral_source` column.

---

## 2. Refactoring Strategy

### 2.1. Shared Tenant Resolution Helper
To avoid code duplication, we recommend introducing a utility function in `lib/auth.ts` or a shared module:

```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getUserOrganization(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .single();

  if (error || !membership) {
    return null;
  }
  return membership;
}
```

### 2.2. Strict Types Integration
Import the following types from `lib/types.ts`:
```typescript
import { OrgMemberRole, PricingPlanType, SubscriptionStatus } from "@/lib/types";
```
When creating organizations and members (e.g. during signup), use these types explicitly:
* `role: 'owner' as OrgMemberRole`
* `plan_type: 'monthly' as PricingPlanType`
* `dodo_subscription_status: 'pending' as SubscriptionStatus`

---

## 3. Concrete Code Proposals

### 3.1. `app/actions/auth.ts`
Proposed changes for key functions:

#### A. Refactoring `updateProfileInfo`:
```typescript
export async function updateProfileInfo(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const first_name = formData.get("first_name") as string || null;
  const last_name = formData.get("last_name") as string || null;
  const company_name = formData.get("company_name") as string || null;

  // 1. Fetch user organization membership
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  // 2. Update profiles table (combining first and last name into full_name)
  const fullName = [first_name, last_name].filter(Boolean).join(" ").trim() || null;
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("user_id", user.id);

  if (profileError) {
    redirect(buildPathWithQuery("/settings/general", { error: "Failed to update profile details" }));
  }

  // 3. Update organization table using organization_id
  if (company_name && membership?.organization_id) {
    const { error: orgError } = await supabase
      .from("organizations")
      .update({ name: company_name })
      .eq("id", membership.organization_id);

    if (orgError) {
      redirect(buildPathWithQuery("/settings/general", { error: "Failed to update organization details" }));
    }
  }

  redirect(buildPathWithQuery("/settings/general", { success: "Profile details updated" }));
}
```

#### B. Refactoring `signup` (creating organization & member record):
```typescript
// Insert after auth.signUp succeeds:
if (data.user) {
  const adminSupabase = createSupabaseAdminClient();
  const fullName = getString(formData, "full_name");
  
  // 1. Insert new organization
  const { data: org, error: orgError } = await adminSupabase
    .from("organizations")
    .insert({
      name: `${fullName}'s Workspace`,
      plan_type: 'monthly' as PricingPlanType,
      dodo_subscription_status: 'pending' as SubscriptionStatus,
    })
    .select("id")
    .single();

  if (!orgError && org) {
    // 2. Insert member as owner
    await adminSupabase
      .from("organization_members")
      .insert({
        organization_id: org.id,
        user_id: data.user.id,
        role: 'owner' as OrgMemberRole,
      });
  }
}
```

### 3.2. `app/actions/feedback.ts`
Enrich feedback message with tenant context:

```typescript
export async function submitFeedback(formData: FormData) {
  const user = await requireUser();
  const message = formData.get("message");

  if (typeof message !== "string" || message.trim().length === 0) {
    redirect("/feedback?error=Feedback+message+is+required.");
  }

  if (message.length > 2000) {
    redirect("/feedback?error=Feedback+message+is+too+long.");
  }

  // Retrieve tenant context
  const supabase = await createSupabaseServerClient();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  let orgName = "No active organization";
  if (membership?.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", membership.organization_id)
      .single();
    if (org) {
      orgName = org.name;
    }
  }

  try {
    const enrichedMessage = `Organization: ${orgName} (ID: ${membership?.organization_id || "N/A"})\n\n${message.trim()}`;
    await sendFeedbackEmail({
      userEmail: user.email ?? "unknown@user.com",
      message: enrichedMessage,
    });
  } catch (error) {
    redirect(
      `/feedback?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to send feedback.",
      )}`,
    );
  }

  redirect("/dashboard?success=Thank+you+for+your+feedback!");
}
```

### 3.3. `app/actions/leads.ts`
* The leads table has no `organization_id` or `user_id`.Tenancy filtering is not applicable.
* Propose fixing the `leads` table in `supabase/schema.sql` to avoid query errors.

---

## 4. Key Caveats & Discrepancies
1. **Missing Columns in Schema**:
   * `profiles`: Missing `first_name`, `last_name`, and `company_name`. In our strategy, `first_name` and `last_name` are combined into `full_name`. `company_name` is stored in the `organizations` table.
   * `leads`: Missing `referral_source`. This column must be added to the schema:
     ```sql
     ALTER TABLE leads ADD COLUMN referral_source TEXT;
     ```
2. **SignUp Transactionality**: If organization creation fails during sign up, the user account will still be created in auth. An onboarding check should be added to handle users who log in without any active organization memberships.
