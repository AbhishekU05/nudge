# Adversarial Challenge Report: Server Actions & Settings Migration

## Challenge Summary

**Overall risk assessment**: CRITICAL

## Challenges

### [Critical] Challenge 1: Google/OAuth Signups Produce Tenantless Users

- **Assumption challenged**: Assumed that the only user registration route is via the email/password `signup` server action, or that organization provisioning is automatically handled elsewhere.
- **Attack scenario**: A new user signs up using Google OAuth. They are redirected to `app/auth/callback/route.ts` which exchanges their OAuth code for a session and logs them in. Because the organization creation and membership mapping logic is completely missing from the OAuth callback handler (and is only defined in the custom `signup` server action), this user will successfully authenticate but have no organization, leading to application crashes on the dashboard.
- **Blast radius**: All new users registering via Google OAuth.
- **Mitigation**: Add a database trigger on the `auth.users` table to automatically provision a workspace and associate the user as the owner, or implement organization verification and provisioning inside `/auth/callback/route.ts`.

### [High] Challenge 2: Privilege Escalation in Organization Renaming

- **Assumption challenged**: Assumed that any user fetching their organization ID is authorized to modify its name, or database RLS will check permissions.
- **Attack scenario**: A regular user with role `'member'` submits a `company_name` via `updateProfileInfo`. The backend fetches their `organization_id` and calls the Supabase admin client to update the workspace's name. Since the admin client bypasses RLS, and there is no role check (e.g. checking if the user is `'owner'` or `'admin'`) in the server action code, the `'member'` successfully renames the organization for the entire company.
- **Blast radius**: Unauthorized modification of corporate workspace details by low-privilege members.
- **Mitigation**: Query the member's role from `organization_members` and check if `role === 'owner' || role === 'admin'` before renaming the organization.

### [Medium] Challenge 3: Inefficient and Redundant User Enumeration Loop

- **Assumption challenged**: Assumed that querying the Supabase Auth API paginated user list is necessary to detect duplicate email registrations.
- **Attack scenario**: During signup, the server action makes up to 10 sequential API calls to `listUsers` to search for the signing-up email address. In a real-world system, as the user count increases, this loop degrades performance, causes API rate-limiting issues, and risks timing out the Server Action.
- **Blast radius**: Inability to scale user signups and potential server action timeouts.
- **Mitigation**: Remove `isExistingAuthEmail` entirely. Rely on Supabase's native behavior where `signUp` returns a user with an empty `identities` array (which the action already checks and handles) when an email already exists.

### [Medium] Challenge 4: Security Leakage via Public Domain Classification

- **Assumption challenged**: Assumed that checking against a static array of popular domains is sufficient to identify personal/non-corporate users.
- **Attack scenario**: A user registers with a regional public address such as `user@gmail.co.uk` or `user@yahoo.fr`. Since these domains are not listed in the hardcoded `PERSONAL_DOMAINS` array, the system marks them as corporate and attempts to auto-join them to an existing organization of the same domain. If another unrelated user registers with the same domain, they will be auto-joined into the first user's tenant workspace, leaking private data.
- **Blast radius**: Complete data leakage and tenant cross-access for users of regional public email domains.
- **Mitigation**: Use a domain parser library or a comprehensive list of public suffix domains (e.g. publicsuffix.org or disposable/personal email lists) to identify non-corporate domains before auto-joining.

### [Medium] Challenge 5: Cache Invalidation Omission on Lifetime Deal Spots

- **Assumption challenged**: Assumed that calling `revalidatePath('/', 'layout')` will refresh cached data returned by `unstable_cache`.
- **Attack scenario**: When a user registers for the lifetime deal, `captureLifetimeDealLead` updates the lead count and calls `revalidatePath`. However, the landing page fetches the remaining spots via `getRemainingLifetimeSpots` which is cached for 1 hour under the tag `['lifetime-spots']`. Because `revalidateTag` is never invoked, the old spot count is displayed on the landing page for up to 60 minutes.
- **Blast radius**: UI data mismatch and potential overselling of limited spots.
- **Mitigation**: Call `revalidateTag('lifetime-spots')` in `captureLifetimeDealLead`.

### [Medium] Challenge 6: Input Validation Failure in Leads Capture

- **Assumption challenged**: Assumed that inputs passed to leads actions are pre-validated.
- **Attack scenario**: `captureLead` receives a null or undefined email parameter, throwing a `TypeError: Cannot read properties of null (reading 'toLowerCase')` and crashing the server action. Alternatively, a malformed email passes checks and is inserted directly into the database.
- **Blast radius**: Action crashes and database pollution.
- **Mitigation**: Implement `validateEmail` checks inside `captureLead` and `captureLifetimeDealLead`.

### [Medium] Challenge 7: Missing Profile Creation Database Trigger

- **Assumption challenged**: Assumed that user profiles are created automatically on database setup.
- **Attack scenario**: A developer deploys the database schema from `supabase/schema.sql` and signs up. Because `schema.sql` contains no trigger or function to copy rows from `auth.users` to `public.profiles`, the new user has no profile row. Subsequent calls to `updateProfileInfo` or `updateProfileName` target `profiles` but modify 0 rows, resulting in silent failures. Additionally, `requireAdmin` in `lib/auth.ts` queries a non-existent `is_admin` column in `profiles`.
- **Blast radius**: Complete failure of profile updates and administrative functions.
- **Mitigation**: Add a database trigger and function to `schema.sql` to auto-insert profiles, and align `lib/auth.ts` with the actual database schema.

## Stress Test Results

- Google OAuth Signup → Bypasses signup provisioning → Redirects to Dashboard → User is left tenantless (Fail)
- Regular Member Updates Company Name → Bypasses RLS via admin client → Successfully renames company → Privilege Escalation (Fail)
- Regional Domain Signup (`gmail.co.uk`) → Marked as corporate domain → Auto-joins unrelated user's workspace → Tenant data leak (Fail)
- Lifetime Lead Signup → `revalidatePath` executes but cache is untouched → Page shows stale spot count (Fail)
- Null Email on captureLead → Calls `email.toLowerCase()` → Action throws TypeError (Fail)

## Unchallenged Areas

- Feedback email SMTP configuration — Not challenged due to lack of environment credentials and mock SMTP setup.
