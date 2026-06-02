-- Add columns for standalone Gmail integration (separate from auth login).
-- gmail_connected_email stores which Gmail address was authorized.
-- gmail_oauth_state stores a temporary CSRF token during the OAuth flow.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gmail_connected_email text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gmail_oauth_state text DEFAULT NULL;
