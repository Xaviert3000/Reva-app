-- Fix "Database error saving new user" on signup.
-- The original handle_new_user() was SECURITY DEFINER without a fixed
-- search_path and referenced an unqualified `profiles`. When Supabase Auth
-- fires the trigger, search_path does not include `public`, so the insert
-- fails and Auth aborts the signup with "Database error saving new user".
--
-- Hardened version: schema-qualified table, explicit empty search_path,
-- and ON CONFLICT so a retry / pre-existing row never breaks signup.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Recreate the trigger to be safe (idempotent).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
