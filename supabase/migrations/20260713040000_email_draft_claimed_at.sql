-- approveDraft claims a row into status 'sending' before handing the email to
-- Resend, so that two concurrent approvals cannot both send. The claim is only
-- half the story: if the process dies mid-send the row stays 'sending' forever,
-- and a claim conditional on status = 'draft' can never take it back - the draft
-- is stranded and cannot be retried.
--
-- claimed_at records when the claim was taken, so a claim can distinguish:
--   - a genuinely in-flight send (claimed seconds ago)  -> refuse, the other
--     caller owns it;
--   - an abandoned claim (claimed minutes ago, nobody finished)  -> take it over.
--
-- Retrying an abandoned claim is safe: the send carries a Resend idempotency key
-- derived from the draft id, so Resend will not deliver the message twice.
alter table email_drafts
  add column if not exists claimed_at timestamptz;
