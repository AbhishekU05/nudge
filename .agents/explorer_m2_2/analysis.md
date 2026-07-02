# Refactoring Strategy: B2B Multi-Tenant Migration (Milestone 2)

## Overview
This report outlines the detailed refactoring strategy to migrate the server actions in `app/actions/auth.ts`, `app/actions/feedback.ts`, and `app/actions/leads.ts` from a legacy single-tenant schema to a B2B multi-tenant schema.

The target schema features:
- **`organizations`**: Holds company-level settings (billing, subscription, pricing plan, domain, credits).
- **`organization_members`**: Associates users with organizations under defined roles (`owner`, `admin`, `member`).
- **`profiles`**: Retains user-specific settings (timezone, digest settings, full name).

---

## 1. Schema Analysis & Discrepancies

### A. Profiles Table
- **Legacy State**: The `updateProfileInfo` action in `auth.ts` attempts to update `first_name`, `last_name`, and `company_name` directly in the `profiles` table.
- **Multi-Tenant State**: The `profiles` table in `supabase/schema.sql` only has `full_name`. `company_name` is no longer a part of `profiles` (it maps to the name of the user's organization in `organizations`).
- **Missing Columns in Schema**:
  - `referral_source`: Used in `app/auth/callback/route.ts` line 64 and `app/actions/auth.ts` line 144 to update user referral data on the `profiles` table. However, `referral_source` is **not** present on the `profiles` table in `supabase/schema.sql`.
- **Refactoring Solution**:
  - Combine `first_name` and `last_name` into `full_name` when updating `profiles`.
  - Fetch `organization_id` from `organization_members` for the user, and update the associated organization's name with `company_name`.
  - Recommend adding `referral_source TEXT` to the `profiles` table schema to avoid runtime errors on user registration/callbacks.

### B. Leads Table
- **Schema Discrepancy**: The `leads` table in `supabase/schema.sql` is defined as:
  ```sql
  CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
  However, `app/actions/leads.ts` references the column `referral_source` in:
  - `captureLifetimeDealLead` (upserting `{ referral_source: 'lifetime_deal' }`)
  - `getRemainingLifetimeSpots` (filtering `.eq('referral_source', 'lifetime_deal')`)
- **Refactoring Solution**:
  - Since leads are captured from the public landing page prior to login/organization registration, they are globally scoped and cannot be filtered by `organization_id`.
  - To prevent runtime failures, the database schema for the `leads` table must be updated to include `referral_source TEXT`.

---

## 2. Refactoring Strategy by File

### File A: `app/actions/auth.ts`

#### Helper: Organization Resolution
To ensure a robust multi-tenant context, we must retrieve the `organization_id` from `organization_members` using the authenticated user's ID. We can define a reusable query pattern:
```typescript
import { OrgMemberRole } from "@/lib/types";

// Fetches the user's active organization membership
export async function getUserMembership(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}
```

#### Action: `signup`
When a user registers:
1. Extract domain from email (e.g. `company.com` from `user@company.com`).
2. Filter out common personal domains (`gmail.com`, `yahoo.com`, `hotmail.com`, `outlook.com`, `icloud.com`, `aol.com`).
3. Query `organizations` to check if an organization exists with the same domain.
4. **Auto-join**: If found, insert a record in `organization_members` linking the user to the existing organization with role `'member'`.
5. **New Provision**: If not found (or if personal domain), create a new organization named `${fullName}'s Workspace` and associate the user in `organization_members` with role `'owner'`.

*Draft implementation detail:*
```typescript
const emailParts = email.split('@');
const domain = emailParts[1]?.toLowerCase();
const personalDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com"];
const isPersonal = personalDomains.includes(domain);

let orgId: string | null = null;
if (!isPersonal && domain) {
  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("domain", domain)
    .single();
  if (existingOrg) orgId = existingOrg.id;
}

if (orgId) {
  // Join existing organization
  await supabase.from("organization_members").insert({
    organization_id: orgId,
    user_id: data.user.id,
    role: "member" as OrgMemberRole
  });
} else {
  // Create a new organization
  const { data: newOrg } = await supabase
    .from("organizations")
    .insert({
      name: `${fullName}'s Workspace`,
      domain: isPersonal ? null : domain
    })
    .select("id")
    .single();

  if (newOrg) {
    await supabase.from("organization_members").insert({
      organization_id: newOrg.id,
      user_id: data.user.id,
      role: "owner" as OrgMemberRole
    });
  }
}
```

#### Action: `updateProfileInfo`
Refactor this action to align with the new schema:
1. Combine `first_name` and `last_name` into `full_name` and update the `profiles` table.
2. Query `organization_members` using the user's ID to get `organization_id`.
3. If an organization ID exists and `company_name` is provided, update the organization's `name` in the `organizations` table.

*Draft implementation detail:*
```typescript
const first_name = formData.get("first_name") as string || null;
const last_name = formData.get("last_name") as string || null;
const company_name = formData.get("company_name") as string || null;

const fullName = [first_name, last_name].filter(Boolean).join(" ") || null;

// 1. Update Profile (User level)
const { error: profileError } = await supabase
  .from("profiles")
  .update({ full_name: fullName })
  .eq("user_id", user.id);

if (profileError) throw profileError;

// 2. Fetch organization_id & Update Organization (Company level)
const membership = await getUserMembership(user.id);
if (membership?.organization_id && company_name) {
  const { error: orgError } = await supabase
    .from("organizations")
    .update({ name: company_name })
    .eq("id", membership.organization_id);
    
  if (orgError) throw orgError;
}
```

#### Action: `updateProfileName`
Update to write back the new `full_name` to the user's record in the `profiles` table in addition to the metadata update.
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("user_id", user.id);
}
```

#### Action: `updateDigestSettings`
No changes are required to `organization_id` filtering because `profiles` is a single-tenant, user-specific table. The lookup remains safely scoped to `.eq("user_id", user.id)`.

---

### File B: `app/actions/feedback.ts`

Currently, `submitFeedback` only retrieves the user's email and sends a raw feedback email via Resend.
To integrate with the B2B multi-tenant schema:
1. Retrieve the `organization_id` using the user's ID from `organization_members`.
2. Query `organizations` to fetch the organization name.
3. Append both `Organization ID` and `Organization Name` to the feedback text body so support emails carry tenant context.

*Draft implementation detail:*
```typescript
const membership = await getUserMembership(user.id);
let orgContext = "\n\n--- Tenant Context ---";
if (membership?.organization_id) {
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", membership.organization_id)
    .single();
  orgContext += `\nOrganization Name: ${org?.name ?? "Unknown"}\nOrganization ID: ${membership.organization_id}`;
} else {
  orgContext += `\nOrganization: Personal / No Organization`;
}

await sendFeedbackEmail({
  userEmail: user.email ?? "unknown@user.com",
  message: message.trim() + orgContext,
});
```

---

### File C: `app/actions/leads.ts`

1. **Global Scope**: Leads actions (`captureLead`, `captureLifetimeDealLead`, `getRemainingLifetimeSpots`) do not authenticate users. They capture public landing page entries. Therefore, they remain globally scoped and must **not** be filtered by `organization_id`.
2. **Schema Alignment**: Recommend schema migration to add `referral_source TEXT` to the `leads` table to match the upsert and count queries.

---

## 3. Strict Type Integration (`lib/types.ts`)
- Ensure all DB interactions cast or use strict union types imported from `lib/types.ts` (e.g. `OrgMemberRole` and `SubscriptionStatus`).
- Explicitly type variables:
  ```typescript
  import { OrgMemberRole } from "@/lib/types";
  const memberRole: OrgMemberRole = "owner";
  ```

---

## 4. Compilation & Verification Plan
- **TypeScript**: Run `npx tsc --noEmit` to verify type-safety and ensure no compiler errors.
- **Frontend Impact**: Ensure all function signatures and return values are preserved to prevent breaking any frontend `.tsx` components.
