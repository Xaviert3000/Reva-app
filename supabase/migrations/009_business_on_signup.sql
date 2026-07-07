-- Create the real business + owner membership at signup time.
--
-- The signup form (biz/register) passes business_name, business_type and
-- role='business' in the Auth user metadata. Until now handle_new_user only
-- created a profile, so the business the owner typed was thrown away and the
-- panel fell back to demo data. Here we extend the trigger to also insert a
-- businesses row and link the owner via biz_members.

-- Track whether the owner has finished the onboarding wizard, so the panel
-- only shows it once instead of on every login.
alter table businesses add column if not exists onboarded boolean default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta        jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  biz_name    text  := nullif(trim(meta->>'business_name'), '');
  new_biz_id  text;
begin
  -- Always create the profile row for the new user.
  insert into public.profiles (id, full_name)
  values (new.id, meta->>'full_name')
  on conflict (id) do nothing;

  -- Business owners (role='business' with a business name) get a real business
  -- record + an owner membership. Guests (app users) skip this block.
  if (meta->>'role') = 'business' and biz_name is not null then
    new_biz_id := 'biz_' || substr(md5(new.id::text || clock_timestamp()::text), 1, 12);

    insert into public.businesses (id, name, full_name, type, kind, mono, agent_active, onboarded)
    values (
      new_biz_id,
      biz_name,
      biz_name,
      meta->>'business_type',
      meta->>'business_type',
      upper(substr(biz_name, 1, 1)),
      false,
      false
    );

    insert into public.biz_members (biz_id, user_id, role)
    values (new_biz_id, new.id, 'owner')
    on conflict (biz_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

-- Trigger already exists from 001/008; recreate to be safe (idempotent).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- The panel loads "my business" from the client by reading biz_members with the
-- logged-in user's session. Lock it down so a member only sees their own rows.
-- The signup trigger runs as SECURITY DEFINER, so it bypasses these policies.
alter table biz_members enable row level security;

drop policy if exists "Members see own membership" on biz_members;
create policy "Members see own membership" on biz_members
  for select using (auth.uid() = user_id);
