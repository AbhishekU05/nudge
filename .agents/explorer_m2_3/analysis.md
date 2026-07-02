# Refactoring Analysis & Migration Strategy (Auth, Feedback, Leads Actions)

This report outlines the detailed findings and the proposed refactoring strategy to migrate the server actions in `app/actions/auth.ts`, `app/actions/feedback.ts`, and `app/actions/leads.ts` from a legacy single-tenant schema to a B2B multi-tenant schema.

---

## 1. Current State Assessment & DB Interactions

### app/actions/auth.ts
- **Functionality**: Manages user authentication (signup, login, logout, password resets, Google OAuth) and profile/settings updates.
- **Database Operations**:
  - Updates the `profiles` table in `updateDigestSettings` and `updateProfileInfo` using `.eq("user_id", user.id)`.
- **Schema Mismatches**:
  - `updateProfileInfo` attempts to update `first_name`, `last_name`, and `company_name` directly on the `profiles` table. However, in the B2B schema defined in `supabase/schema.sql`, `profiles` only has a `full_name` column and does not have `first_name`, `last_name`, or `company_name`.
  - `signup` adds `referral_source` inside the auth metadata, and `app/auth/callback/route.ts` updates `referral_source` on `profiles`. However, the `profiles` table schema is missing the `referral_source` column.

### app/actions/feedback.ts
- **Functionality**: Handles sending user feedback via email using Resend.
- **Database Operations**: None in the action itself.
- **Multi-Tenant Context**: Currently, it does not retrieve the user's organization context when sending feedback. Enforcing rate-limiting in a peer feedback action (`app/(app)/settings/feedback/actions.ts`) relies on `enforceRateLimit(user.id, "feedback_submit")`, which inserts into `usage_events` using `user_id` without the required `organization_id`.

### app/actions/leads.ts
- **Functionality**: Captures public email leads from the landing page and lifetime deal prospects.
- **Database Operations**:
  - Inserts/upserts records into the `leads` table.
- **Schema Mismatches**:
  - `captureLifetimeDealLead` inserts/upserts `{ email, referral_source: 'lifetime_deal' }` into `leads`.
  - `getRemainingLifetimeSpots` filters leads using `.eq('referral_source', 'lifetime_deal')`.
  - However, in `schema.sql`, the `leads` table only has `id`, `email`, and `created_at`. It is missing the `referral_source` column.

---

## 2. Schema Requirements & Strict Types (from `lib/types.ts`)

To enforce strict type-safety, we will map legacy database fields to the multi-tenant schema using the types and enums defined in `lib/types.ts`:

1. **`OrgMemberRole`**: Strict enum `'owner' | 'admin' | 'member'` used to type roles in `organization_members`.
2. **`SubscriptionStatus`**: Strict enum `'pending' | 'active' | 'on_hold' | 'paused' | 'canceled' | 'failed' | 'past_due' | 'expired'` representing the organization's billing state.
3. **`Profile`**: Defines fields mapped to user settings:
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
4. **Proposed Additions to `lib/types.ts`**:
   - To support leads:
     ```typescript
     export interface Lead {
       id: string;
       email: string;
       referral_source?: string | null;
       created_at: string;
     }
     ```

---

## 3. Detailed Refactoring Strategy

### A. Retrieving the Organization ID
All authenticated server actions must first fetch the user session and then retrieve the user's `organization_id` and role from the `organization_members` table:
```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { OrgMemberRole } from "@/lib/types";

async function getOrgContext() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  
  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !membership) {
    // Graceful redirect or error throwing based on context
    throw new Error("No organization association found. Please complete onboarding.");
  }

  return {
    userId: user.id,
    userEmail: user.email,
    organizationId: membership.organization_id,
    role: membership.role as OrgMemberRole,
  };
}
```

### B. Action Refactoring Strategy

#### 1. `app/actions/auth.ts`
- **Onboarding/Signup Organization Creation**:
  Since new signups don't have an organization, we recommend creating a workspace and membership in `app/auth/callback/route.ts` or during first-login. Because of RLS, this must use `createSupabaseAdminClient()`:
  ```typescript
  import { createSupabaseAdminClient } from "@/lib/supabase/admin";
  
  export async function provisionOrganization(userId: string, email: string, fullName: string) {
    const adminSupabase = createSupabaseAdminClient();
    
    // Determine domain auto-join if non-generic domain
    const domain = email.split("@")[1]?.toLowerCase();
    const genericDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];
    const targetDomain = genericDomains.includes(domain) ? null : domain;
    
    if (targetDomain) {
      // Check if domain-based org already exists
      const { data: existingOrg } = await adminSupabase
        .from("organizations")
        .select("id")
        .eq("domain", targetDomain)
        .maybeSingle();
        
      if (existingOrg) {
        // Auto-join existing org as a member
        await adminSupabase.from("organization_members").insert({
          organization_id: existingOrg.id,
          user_id: userId,
          role: "member",
        });
        return existingOrg.id;
      }
    }
    
    // Create new organization
    const { data: newOrg, error: orgError } = await adminSupabase
      .from("organizations")
      .insert({
        name: `${fullName}'s Workspace`,
        domain: targetDomain,
      })
      .select("id")
      .single();
      
    if (orgError || !newOrg) throw orgError || new Error("Failed to create workspace");
    
    // Assign creator as 'owner'
    await adminSupabase.from("organization_members").insert({
      organization_id: newOrg.id,
      user_id: userId,
      role: "owner",
    });
    
    return newOrg.id;
  }
  ```

- **Refactoring `updateProfileInfo`**:
  Instead of updating `first_name`, `last_name`, and `company_name` directly in `profiles`, we split updates:
  - `first_name` and `last_name` are concatenated and saved to `profiles.full_name`.
  - `company_name` is saved to `organizations.name` using the retrieved `organizationId`.
  ```typescript
  export async function updateProfileInfo(formData: FormData) {
    const supabase = await createSupabaseServerClient();
    const { userId, organizationId } = await getOrgContext();
  
    const first_name = formData.get("first_name") as string || null;
    const last_name = formData.get("last_name") as string || null;
    const company_name = formData.get("company_name") as string || null;
  
    const fullName = [first_name, last_name].filter(Boolean).join(" ") || null;
  
    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("user_id", userId);
  
    if (profileError) {
      redirect(buildPathWithQuery("/settings/general", { error: "Failed to update profile details" }));
    }
  
    // Update company/organization name
    if (company_name) {
      const { error: orgError } = await supabase
        .from("organizations")
        .update({ name: company_name })
        .eq("id", organizationId);
        
      if (orgError) {
        redirect(buildPathWithQuery("/settings/general", { error: "Failed to update organization name" }));
      }
    }
  
    redirect(buildPathWithQuery("/settings/general", { success: "Profile details updated" }));
  }
  ```

#### 2. `app/actions/feedback.ts`
Enhance feedback submission by appending organization metadata to Resend emails, providing support with clear workspace context:
```typescript
export async function submitFeedback(formData: FormData) {
  const { userId, userEmail, organizationId } = await getOrgContext();
  const message = formData.get("message");
  
  // Validation checks...
  
  // Retrieve organization name for metadata
  const supabase = await createSupabaseServerClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .single();

  try {
    await sendFeedbackEmail({
      userEmail: userEmail ?? "unknown@user.com",
      message: `${message.trim()}\n\n---\nB2B Context:\nOrganization ID: ${organizationId}\nOrganization Name: ${org?.name || "Unknown"}\nUser ID: ${userId}`,
    });
  } catch (error) {
    // Graceful error handling redirects...
  }
  
  redirect("/dashboard?success=Thank+you+for+your+feedback!");
}
```

#### 3. `app/actions/leads.ts`
No multi-tenant refactoring is required here since leads are public prospects. However, schema and type alignments are needed:
- Propose database migration to add `referral_source TEXT` to the `leads` table.
- Maintain use of the Admin client (`createSupabaseAdminClient`) for operations bypassing strict read/write RLS restrictions on public/admin views.

---

## 4. Verification Plan

To verify the migrations without breaking the application:

1. **Schema Check**:
   Apply SQL migration to add missing fields (`referral_source` on `leads` and `profiles` tables).
2. **Type Compilation**:
   Ensure no TypeScript compilation issues by running:
   ```bash
   npx tsc --noEmit
   ```
3. **E2E Testing**:
   Execute the project tests to verify authentication and actions flow:
   ```bash
   npm run test
   ```
