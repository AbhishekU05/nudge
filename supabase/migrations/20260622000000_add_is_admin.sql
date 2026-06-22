ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false NOT NULL;

UPDATE public.profiles p
SET is_admin = true
FROM auth.users u
WHERE p.user_id = u.id AND u.email = 'a.upadhya05@gmail.com';
