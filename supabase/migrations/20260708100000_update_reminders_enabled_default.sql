-- Change default value of reminders_enabled to false
ALTER TABLE invoices ALTER COLUMN reminders_enabled SET DEFAULT false;

-- Update all existing true values to false
UPDATE invoices SET reminders_enabled = false WHERE reminders_enabled = true;
