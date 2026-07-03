-- Reva initial schema

-- Enable RLS
alter database postgres set "app.jwt_secret" to 'your-jwt-secret';

-- Businesses
create table if not exists businesses (
  id          text primary key,
  name        text not null,
  full_name   text,
  type        text,
  kind        text,
  hood        text,
  estado      text default 'Baja California Sur',
  municipio   text default 'Los Cabos',
  hours       text,
  capacity    integer default 50,
  rating      numeric(3,1) default 0,
  local_fav   boolean default false,
  featured    boolean default false,
  agent_active boolean default false,
  lat         numeric,
  lng         numeric,
  grad_from   text,
  grad_to     text,
  mono        char(1),
  created_at  timestamptz default now()
);

-- Services / catalog
create table if not exists services (
  id          uuid primary key default gen_random_uuid(),
  biz_id      text references businesses(id) on delete cascade,
  name        text not null,
  description text,
  price       numeric,
  deposit     numeric default 0,
  duration_min integer,
  active      boolean default true
);

-- Reservations
create table if not exists reservations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  biz_id        text references businesses(id),
  service_id    uuid references services(id),
  slot          timestamptz,
  party         integer default 1,
  notes         text,
  deposit_amount numeric default 0,
  deposit_paid  boolean default false,
  status        text default 'pending',  -- pending | confirmed | completed | cancelled | no_show
  source        text default 'reva',     -- reva | walk_in | phone
  created_at    timestamptz default now()
);

-- Messages
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  biz_id      text references businesses(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  from_role   text not null,             -- user | biz | reva
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz default now()
);

-- Payments
create table if not exists payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id),
  biz_id              text references businesses(id),
  reservation_id      uuid references reservations(id),
  stripe_session_id   text unique,
  amount              numeric not null,
  currency            text default 'mxn',
  type                text,              -- deposit | featured | subscription
  status              text default 'pending',
  created_at          timestamptz default now()
);

-- Reviews
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  biz_id      text references businesses(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  rating      integer check (rating between 1 and 5),
  body        text,
  is_local    boolean default false,
  created_at  timestamptz default now()
);

-- User profiles
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  mode        text default 'explorer',   -- explorer | vecino
  lang        text default 'es',
  boomerang_id text,
  created_at  timestamptz default now()
);

-- Business owners
create table if not exists biz_members (
  id      uuid primary key default gen_random_uuid(),
  biz_id  text references businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role    text default 'owner',          -- owner | staff
  unique(biz_id, user_id)
);

-- RLS policies
alter table reservations enable row level security;
create policy "Users see own reservations" on reservations for select using (auth.uid() = user_id);
create policy "Users create own reservations" on reservations for insert with check (auth.uid() = user_id);

alter table messages enable row level security;
create policy "Users see own messages" on messages for select using (auth.uid() = user_id);
create policy "Users send messages" on messages for insert with check (auth.uid() = user_id);

alter table profiles enable row level security;
create policy "Users see own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

alter table payments enable row level security;
create policy "Users see own payments" on payments for select using (auth.uid() = user_id);

-- Trigger: auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
