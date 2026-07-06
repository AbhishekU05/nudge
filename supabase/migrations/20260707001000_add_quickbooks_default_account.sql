ALTER TABLE integrations ADD COLUMN IF NOT EXISTS quickbooks_default_account_id text;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS quickbooks_default_account_name text;
