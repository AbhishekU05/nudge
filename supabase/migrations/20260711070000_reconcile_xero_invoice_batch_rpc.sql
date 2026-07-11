-- Used by scratch/reconcile-xero-invoice-statuses.ts. A single function
-- invocation is one Postgres transaction: if anything in this batch fails
-- (a constraint violation, etc.), everything in the call rolls back and
-- nothing is left half-applied for that org.
--
-- SECURITY: never grant EXECUTE on this to `authenticated`. It takes
-- organization_id as a raw parameter with no membership check against the
-- calling user, which would let any logged-in user pass a different org's
-- id and delete/modify that org's invoices. It's SECURITY DEFINER (needed
-- to bypass RLS for the delete/update) and is only ever meant to be called
-- with the service role key from the trusted reconciliation script above,
-- never from an end-user session - the service role already has full
-- unrestricted DB access regardless, so this doesn't expand what it can do.
CREATE OR REPLACE FUNCTION reconcile_xero_invoice_batch(
  p_organization_id UUID,
  p_delete_ids UUID[],
  p_written_off_ids UUID[]
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM invoices
  WHERE organization_id = p_organization_id
    AND id = ANY(p_delete_ids);

  -- The status != 'written_off' guard makes re-running the same batch a
  -- no-op rather than an error or a redundant write.
  UPDATE invoices
  SET status = 'written_off'
  WHERE organization_id = p_organization_id
    AND id = ANY(p_written_off_ids)
    AND status != 'written_off';
END;
$$;

REVOKE EXECUTE ON FUNCTION reconcile_xero_invoice_batch(UUID, UUID[], UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reconcile_xero_invoice_batch(UUID, UUID[], UUID[]) TO service_role;
