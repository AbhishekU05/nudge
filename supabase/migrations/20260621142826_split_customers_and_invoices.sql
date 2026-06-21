-- Migration to split `customers` table into `invoices` and a new `customers` table.

-- 1. Create true customers table
CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own clients" ON public.clients FOR ALL USING (auth.uid() = user_id);

-- 2. Rename existing customers table to invoices
ALTER TABLE public.customers RENAME TO invoices;

-- Rename indexes (this is optional but good practice)
ALTER INDEX IF EXISTS customers_user_id_idx RENAME TO invoices_user_id_idx;
ALTER INDEX IF EXISTS customers_user_created_idx RENAME TO invoices_user_created_idx;
ALTER INDEX IF EXISTS customers_next_send_at_idx RENAME TO invoices_next_send_at_idx;
ALTER INDEX IF EXISTS customers_user_status_idx RENAME TO invoices_user_status_idx;

-- 3. Add customer_id and invoice_number to invoices
ALTER TABLE public.invoices ADD COLUMN customer_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD COLUMN invoice_number text;

-- 4. Data Migration
-- Populate clients from invoices
INSERT INTO public.clients (user_id, name, email, created_at, updated_at)
SELECT user_id, recipient_name, MAX(recipient_email), MIN(created_at), MAX(updated_at)
FROM public.invoices
GROUP BY user_id, recipient_name;

-- Link invoices to clients
UPDATE public.invoices i
SET customer_id = c.id
FROM public.clients c
WHERE i.user_id = c.user_id AND i.recipient_name = c.name;

-- Update invoice numbers
UPDATE public.invoices
SET invoice_number = COALESCE(xero_invoice_id, stripe_invoice_id, 'INV-' || substr(id::text, 1, 8));

-- 5. Fix customer_events
-- Events currently link to invoices via 'customer_id' column
ALTER TABLE public.customer_events RENAME COLUMN customer_id TO invoice_id;

-- Add a real customer_id to events
ALTER TABLE public.customer_events ADD COLUMN customer_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- Link events to clients via invoice
UPDATE public.customer_events e
SET customer_id = i.customer_id
FROM public.invoices i
WHERE e.invoice_id = i.id;

-- 6. Update RLS policies for invoices
-- Recreate policies for invoices
DROP POLICY IF EXISTS "Users can manage their own customers" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert own customers" ON public.invoices;
DROP POLICY IF EXISTS "Users can update own customers" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete own customers" ON public.invoices;
DROP POLICY IF EXISTS "Users can view own customers" ON public.invoices;

-- If there are remaining old policies, drop them too
DROP POLICY IF EXISTS "reminders_select_own" ON public.invoices;
DROP POLICY IF EXISTS "reminders_insert_own" ON public.invoices;
DROP POLICY IF EXISTS "reminders_update_own" ON public.invoices;
DROP POLICY IF EXISTS "reminders_delete_own" ON public.invoices;

CREATE POLICY "Users can manage their own invoices" ON public.invoices FOR ALL USING (auth.uid() = user_id);

-- Optional: cleanup columns from invoices
-- ALTER TABLE public.invoices DROP COLUMN recipient_name;
-- ALTER TABLE public.invoices DROP COLUMN recipient_email;
