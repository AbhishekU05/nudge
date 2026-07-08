ALTER TABLE email_drafts ADD COLUMN action_type TEXT DEFAULT 'email';
ALTER TABLE email_drafts ADD COLUMN action_payload JSONB DEFAULT '{}';
