ALTER TABLE public.integrations
ADD COLUMN IF NOT EXISTS bank_account_id text,
ADD COLUMN IF NOT EXISTS bank_account_name text;
