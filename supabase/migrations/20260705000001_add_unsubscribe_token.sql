ALTER TABLE clients ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid();
