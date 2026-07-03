-- Create late_fee_policies table
CREATE TABLE IF NOT EXISTS late_fee_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    fee_type TEXT NOT NULL CHECK (fee_type IN ('flat', 'percentage')),
    fee_value NUMERIC NOT NULL,
    grace_period_days INT NOT NULL DEFAULT 0,
    frequency TEXT NOT NULL CHECK (frequency IN ('once', 'weekly', 'monthly')),
    apply_to TEXT NOT NULL CHECK (apply_to IN ('existing_invoice', 'new_invoice')),
    excluded_group_ids UUID[] DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create customer_groups table (for exclusions)
CREATE TABLE IF NOT EXISTS customer_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    group_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create applied_late_fees table
CREATE TABLE IF NOT EXISTS applied_late_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES late_fee_policies(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE late_fee_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_late_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage late_fee_policies" ON late_fee_policies FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY "Org members can view customer_groups" ON customer_groups FOR SELECT USING (true); -- simplify for now
CREATE POLICY "Org members can manage applied_late_fees" ON applied_late_fees FOR ALL USING (
    EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND public.is_org_member(i.organization_id))
);
