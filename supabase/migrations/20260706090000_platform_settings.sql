CREATE TABLE IF NOT EXISTS platform_settings (
  id integer PRIMARY KEY DEFAULT 1,
  quickbooks_mode text NOT NULL DEFAULT 'production',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure only one row exists
ALTER TABLE platform_settings ADD CONSTRAINT platform_settings_single_row CHECK (id = 1);

-- Insert default row
INSERT INTO platform_settings (id, quickbooks_mode) VALUES (1, 'production') ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
