-- email_drafts has had RLS enabled since it was created
-- (20260707233129_add_draft_action.sql) but never had a matching policy.
-- RLS-enabled-with-zero-policies means default deny for every role except
-- service_role - the Automate tab's Sent list and draft queue both query
-- this table via the session-bound (RLS-enforced) client, so they've
-- always silently returned zero rows regardless of how much real data
-- exists, with no error to signal why.
--
-- Matches the same is_org_member() pattern already used for clients,
-- invoices, payments, events, and integrations in supabase/schema.sql.
CREATE POLICY "Org members can manage email_drafts" ON email_drafts
  FOR ALL USING (public.is_org_member(organization_id));
