# Backend Cleanup & Migration Plan (Milestone Based)

This document outlines the step-by-step plan to clean up the backend, remove legacy systems, implement background jobs, and deploy a fresh, scalable B2B database schema.

**Execution Rule:** This plan is strictly milestone-based. We do not proceed to the next milestone until the current one is 100% completed, tested, and approved.

---

## Milestone 1: The Purge (Data & File Cleanup)
**Goal:** Completely wipe the slate clean of legacy data, scripts, and broken migrations.

1. **Wipe Existing Database Data**:
   - Run the SQL queries to delete all user authentication data and drop the public schema to ensure zero data pollution.
   ```sql
   DELETE FROM auth.users;
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```
2. **Delete Test Scripts**: Remove all root-level `.js` test files (e.g., `test-anon.js`, `test-schema.js`, `test_payments.js`).
3. **Delete Utility Scripts**: Remove all unnecessary Python (`*.py`), Shell (`*.sh`), Node (`*.js`), and random TypeScript scripts (`*.ts`) in the root directory (e.g., `patch_seo.py`, `patch_pages.sh`, `check-tables.ts`, `create-leads-table.ts`, `fetch-data.ts`, `proxy.ts`, `query_schema.ts`).
4. **Delete Legacy Migrations**: Delete the entire `supabase/` folder containing the incrementally broken migrations.

---

## Milestone 2: Legacy Payments Purge
**Goal:** Remove all remnants of Stripe, Razorpay, and LemonSqueezy from the codebase.

1. **API Routes**: Delete `app/api/stripe/` webhook and callback routes.
2. **Components**: Remove Stripe configurations and UI integrations from `app/(app)/settings/integrations/`.
3. **Utilities & Types**: Delete `lib/stripe.ts` and clean out all legacy billing types from `lib/types.ts`.
4. **Dependencies**: Uninstall `stripe` and related SDKs from `package.json`.

---

## Milestone 3: Multi-tenant Schema Deployment
**Goal:** Deploy the new B2B SQL schema to Supabase and update the application types.

1. **Create New Migrations**: Generate the new SQL schema prioritizing the `organizations` table for team-based billing and domain auto-joining.
2. **Apply Schema**: Push the new schema to Supabase.
3. **Generate Types**: Run the Supabase CLI to generate the new TypeScript types into the codebase based on the fresh schema.

<details>
<summary>Click to expand the Proposed Core Schema</summary>

```sql
-- ==========================================
-- ENUM TYPES
-- ==========================================
CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'on_hold', 'paused', 'canceled', 'failed', 'past_due', 'expired');
CREATE TYPE org_member_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE invoice_status AS ENUM ('outstanding', 'promised', 'partial', 'paid', 'overdue', 'written_off');
CREATE TYPE crm_event_type AS ENUM ('followup', 'note', 'reminder_sent', 'status_change', 'late_fee_applied');
CREATE TYPE integration_provider AS ENUM ('xero', 'quickbooks');
CREATE TYPE sync_direction AS ENUM ('bidirectional', 'import_only', 'export_only');
CREATE TYPE pricing_plan_type AS ENUM ('monthly', 'annual', 'base_usage');

-- 1. Organizations (Workspaces, Billing, Domain Auto-join)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE, 
  dodo_customer_id TEXT,
  dodo_subscription_id TEXT,
  dodo_subscription_status subscription_status,
  plan_type pricing_plan_type, 
  credits_balance INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Organization Members (Links users to teams)
CREATE TABLE organization_members (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role org_member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

-- 3. Profiles (User-specific settings)
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

-- 4. Clients (Belong to Organization)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT,
  xero_id TEXT, -- Foreign ID for sync mapping
  quickbooks_id TEXT, -- Foreign ID for sync mapping
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Invoices (Belong to Organization)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  due_date DATE,
  status invoice_status DEFAULT 'outstanding',
  payment_link TEXT,
  reminders_enabled BOOLEAN DEFAULT true, -- Explicitly dictates if background job reminders fire
  reminder_frequency_days INT DEFAULT 7,
  next_send_at TIMESTAMPTZ,
  xero_id TEXT, -- Foreign ID for sync mapping
  quickbooks_id TEXT, -- Foreign ID for sync mapping
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Payments (Financial Source of Truth)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, -- Denormalized for RLS performance
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  -- client_id is intentionally omitted; derivable via invoice to prevent sync issues
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  reference_id TEXT, -- External gateway reference
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Events (Audit Trail & CRM Timeline)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  event_type crm_event_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Integrations (Xero, QuickBooks)
CREATE TABLE integrations (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  is_active BOOLEAN DEFAULT true,
  access_token TEXT NOT NULL, -- To be encrypted at rest using pgcrypto or App Layer
  refresh_token TEXT NOT NULL, -- To be encrypted at rest using pgcrypto or App Layer
  expires_at TIMESTAMPTZ NOT NULL,
  tenant_id TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  sync_direction sync_direction DEFAULT 'bidirectional',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (organization_id, provider)
);

-- 9. Usage Events (Rate limiting and tracking credits)
CREATE TABLE usage_events (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  credits_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Leads (Landing page email capture)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  referral_source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Webhook Events (Idempotency for Dodo Payments)
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY, -- The Dodo Payments webhook event ID
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_clients_org_id ON clients(organization_id);

-- Minimum Required Indexes
CREATE INDEX idx_invoices_org_id ON invoices(organization_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_next_send_at ON invoices(next_send_at);
CREATE INDEX idx_events_invoice_id ON events(invoice_id);

-- Additional Helpful Indexes
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
-- Partial index to heavily optimize the daily background jobs searching for due emails
CREATE INDEX idx_invoices_due_reminders ON invoices(next_send_at) WHERE reminders_enabled = true AND status = 'outstanding';

CREATE INDEX idx_payments_org_id ON payments(organization_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_events_org_id ON events(organization_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Helper function to check org membership securely
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = org_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- Organizations: Users can view orgs they belong to
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (public.is_org_member(id));

-- Organization Members: Users can see members of their orgs
CREATE POLICY "Users can view members of their organizations" ON organization_members
  FOR SELECT USING (public.is_org_member(organization_id));

-- Core Tables (Clients, Invoices, Payments, Events, Integrations): Access restricted to org members
CREATE POLICY "Org members can manage clients" ON clients FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage invoices" ON invoices FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage payments" ON payments FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage events" ON events FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can manage integrations" ON integrations FOR ALL USING (public.is_org_member(organization_id));

-- Leads: Public inserts allowed, reads restricted to service role only (admin dashboards)
CREATE POLICY "Anyone can insert leads" ON leads FOR INSERT WITH CHECK (true);
-- No SELECT policy created; relies entirely on server-side service role bypass to view leads.

-- Webhooks: Only server service role can access
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- No public policies created; relies entirely on server-side service role bypass.
```
</details>

---

## Milestone 4: Backend Codebase Alignment (The Code Cleanup)
**Goal:** Refactor the existing application code to run seamlessly on the new multi-tenant database schema.

1. **Refactor Server Actions**: Update all server actions (e.g., `app/actions/customers.ts`, `app/actions/reminders.ts`, `app/actions/clients.ts`) to point to the new `clients` and `invoices` tables instead of the deprecated `customers` table.
2. **Context Shift (Multi-tenant)**: Rewrite data-fetching queries to always filter by `organization_id` instead of checking `auth.uid() = user_id`.
3. **Type Alignment**: Update all frontend components and backend logic that previously relied on free-text database statuses to strictly use the newly generated TypeScript ENUMs (e.g., `invoice_status`, `crm_event_type`).

---

## Milestone 5: Dodo Payments Integration
**Goal:** Implement the new B2B billing engine via Dodo Payments.

1. **Install SDK**: Set up Dodo Payments SDK and environment variables.
2. **Checkout Flow**: Build the checkout route to handle Monthly ($29) and Annual plans, ensuring the subscription attaches to the `organizations` table.
3. **Webhooks & Idempotency**: Implement webhook listeners to update `dodo_subscription_status` and handle credit balance additions. **Critical**: Must store the webhook event ID in `webhook_events` and check for duplicates before processing to handle Dodo's failure retries gracefully.

---

## Milestone 6: Event-Driven Background Jobs (Zero-Cron Architecture)
**Goal:** Offload email tasks and sync logic to Inngest using an entirely event-driven, zero-polling architecture.

1. **Setup Inngest**: Install dependencies and configure `app/api/inngest/route.ts`.
2. **Scheduled Reminders (Sleep)**: Implement the Exact-Time Reminder workflow using `step.sleepUntil(invoice.next_send_at)`. *(Note on Cost: Inngest charges per step. A sleeping function is an active run. While highly elegant and cheap at low-medium scale, we will monitor billing volume as we grow.)*
3. **Accounting Webhooks (Real-Time Sync)**: Instead of cron-polling APIs for updates, configure webhooks in the Xero and QuickBooks Developer Portals to push `Invoice Created` and `Invoice Updated` events directly to our API. These webhooks will trigger Inngest background jobs to sync the data instantly (on-demand and continuously) without any polling.
4. **Self-Perpetuating Weekly Digest**: Replace traditional crons for the weekly digest by using Inngest's scheduled functions or a recursive workflow that gathers org data, emails users with `weekly_digest_enabled = true`, and schedules its own next run.
5. **Transactional Webhooks**: Connect Dodo Payments webhooks to Inngest for sending immediate payment receipts.

---

## Milestone 7: Observability & Telemetry
**Goal:** Implement deep visibility into asynchronous jobs, unexpected errors, and core backend flows using a 3-tier tracking strategy.

1. **Log Aggregation (Axiom / BetterStack)**: Install the Vercel logging integration to automatically intercept the existing structured JSON output from `lib/logger.ts`, enabling real-time dashboarding and filtering without any code changes.
2. **Exception & APM Tracking (Sentry)**: Install `@sentry/nextjs` to globally capture unhandled exceptions, memory leaks, and slow Supabase queries. Update `logger.error` to push stack traces directly to Sentry.
3. **Background Job Visibility (Inngest Native)**: Leverage Inngest's native observability dashboard to monitor executing webhooks, debug stalled step functions, and replay failed background jobs identically in production.
