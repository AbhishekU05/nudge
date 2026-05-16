-- Add referral_source column to profiles
alter table public.profiles
  add column if not exists referral_source text;

-- Update the new user trigger to populate it from metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, referral_source)
  values (
    new.id,
    new.raw_user_meta_data->>'referral_source'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
