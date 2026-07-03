-- Fix customer_groups RLS: add INSERT and DELETE policies scoped to org members
-- The customer_groups.customer_id references clients.id, which has organization_id

-- Drop overly broad SELECT policy
DROP POLICY IF EXISTS "Org members can view customer_groups" ON customer_groups;

-- Proper policies
CREATE POLICY "Org members can select customer_groups" ON customer_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = customer_groups.customer_id
        AND public.is_org_member(c.organization_id)
    )
  );

CREATE POLICY "Org members can insert customer_groups" ON customer_groups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = customer_groups.customer_id
        AND public.is_org_member(c.organization_id)
    )
  );

CREATE POLICY "Org members can delete customer_groups" ON customer_groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = customer_groups.customer_id
        AND public.is_org_member(c.organization_id)
    )
  );
