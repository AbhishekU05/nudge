-- Add automation and sequence columns to clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS reminder_type text NOT NULL DEFAULT 'recurring' CHECK (reminder_type IN ('recurring', 'sequence')),
ADD COLUMN IF NOT EXISTS reminder_templates jsonb NOT NULL DEFAULT '[{"subject": "Your statement from {{company_name}}", "body_html": "<p>Hi {{first_name}},</p><p>You have {{invoice_count}} outstanding invoices totaling <strong>{{total_owed}}</strong>.</p>"}]'::jsonb,
ADD COLUMN IF NOT EXISTS sequence_index integer NOT NULL DEFAULT 0;

-- Add automation and sequence columns to invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_approve boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS next_send_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reminder_frequency_days integer NOT NULL DEFAULT 7,
ADD COLUMN IF NOT EXISTS reminder_type text NOT NULL DEFAULT 'recurring' CHECK (reminder_type IN ('recurring', 'sequence')),
ADD COLUMN IF NOT EXISTS reminder_templates jsonb NOT NULL DEFAULT '[{"subject": "Reminder: Invoice {{invoice_number}}", "body_html": "<p>Hi {{first_name}},</p><p>This is a reminder that invoice {{invoice_number}} for <strong>{{amount_owed}}</strong> is due.</p>"}]'::jsonb,
ADD COLUMN IF NOT EXISTS sequence_index integer NOT NULL DEFAULT 0;
