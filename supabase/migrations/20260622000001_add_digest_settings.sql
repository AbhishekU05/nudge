ALTER TABLE public.profiles ADD COLUMN timezone text DEFAULT 'UTC';
ALTER TABLE public.profiles ADD COLUMN weekly_digest_enabled boolean DEFAULT true;
