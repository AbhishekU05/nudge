ALTER TABLE organizations ADD COLUMN timezone TEXT DEFAULT 'UTC' NOT NULL;

-- Migrate existing timezones from profiles to organizations
-- assuming the owner's timezone should be the organization's timezone
UPDATE organizations o
SET timezone = p.timezone
FROM profiles p
JOIN organization_members om ON om.user_id = p.user_id
WHERE om.organization_id = o.id AND om.role = 'owner';

ALTER TABLE profiles DROP COLUMN timezone;
