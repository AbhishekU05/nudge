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
  referral_source TEXT,
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
  reminders_enabled BOOLEAN DEFAULT false, -- Explicitly dictates if background job reminders fire
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
  sync_state TEXT DEFAULT 'idle',
  sync_pages_completed INT DEFAULT 0,
  sync_pages_total INT DEFAULT 0,
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
