-- Add automation columns to clients table
ALTER TABLE public.clients
ADD COLUMN reminder_frequency_days integer DEFAULT 7 NOT NULL,
ADD COLUMN next_send_at timestamp with time zone,
ADD COLUMN last_sent_at timestamp with time zone,
ADD COLUMN active boolean DEFAULT false NOT NULL,
ADD COLUMN unsubscribed boolean DEFAULT false NOT NULL,
ADD COLUMN unsubscribe_token uuid DEFAULT gen_random_uuid() NOT NULL,
ADD COLUMN auto_approve boolean DEFAULT false NOT NULL;

-- Backfill data from invoices to clients (taking the first invoice's data for each client)
-- This ensures existing clients keep their automation settings if they had any.
UPDATE public.clients c
SET
  reminder_frequency_days = i.reminder_frequency_days,
  next_send_at = i.next_send_at,
  last_sent_at = i.last_sent_at,
  active = i.active,
  unsubscribed = i.unsubscribed,
  unsubscribe_token = i.unsubscribe_token
FROM (
  SELECT DISTINCT ON (customer_id) 
    customer_id, 
    reminder_frequency_days, 
    next_send_at, 
    last_sent_at, 
    active, 
    unsubscribed, 
    unsubscribe_token
  FROM public.invoices
  WHERE customer_id IS NOT NULL
  ORDER BY customer_id, created_at ASC
) i
WHERE c.id = i.customer_id;

-- Now drop the old columns from invoices
ALTER TABLE public.invoices
DROP COLUMN reminder_frequency_days,
DROP COLUMN next_send_at,
DROP COLUMN last_sent_at,
DROP COLUMN active,
DROP COLUMN unsubscribed,
DROP COLUMN unsubscribe_token;

-- Create email_drafts table
CREATE TABLE public.email_drafts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  subject text NOT NULL,
  body_html text NOT NULL,
  
  -- Status: draft, sent, discarded
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'discarded')),
  
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  sent_at timestamp with time zone
);

ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email drafts" 
  ON public.email_drafts 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create a trigger to update updated_at on email_drafts
CREATE TRIGGER set_updated_at_email_drafts
  BEFORE UPDATE ON public.email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
