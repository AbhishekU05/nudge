-- Late fee policies now apply retroactively to every unpaid invoice in their
-- included groups (see lib/inngest/functions/late-fee-workflow.ts), so the
-- new-vs-existing distinction that apply_to encoded no longer exists. The
-- workflow never read the column - applicability was decided by an
-- invoice.created_at >= policy.created_at check, now removed - so dropping it
-- is purely dead-weight cleanup.
ALTER TABLE late_fee_policies DROP COLUMN IF EXISTS apply_to;
