-- 0. Clean up (in case old SQLite schema was accidentally run)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop all tables if they exist to start fresh
drop table if exists public.invoices cascade;
drop table if exists public.appointments cascade;
drop table if exists public.memberships cascade;
drop table if exists public.notifications cascade;
drop table if exists public.reviews cascade;
drop table if exists public.invites cascade;
drop table if exists public.service_packages cascade;
drop table if exists public.visits cascade;
drop table if exists public.shops cascade;
drop table if exists public.profiles cascade;
drop table if exists public.users cascade; -- the old turso table

-- 1. Create Storage Bucket for car photos
insert into storage.buckets (id, name, public) values ('car-photos', 'car-photos', true) on conflict do nothing;

drop policy if exists "Car photos are accessible by everyone." on storage.objects;
create policy "Car photos are accessible by everyone." on storage.objects for select using (bucket_id = 'car-photos');

drop policy if exists "Car photos can be uploaded by authenticated users." on storage.objects;
create policy "Car photos can be uploaded by authenticated users." on storage.objects for insert with check (bucket_id = 'car-photos' and auth.role() = 'authenticated');

-- 2. Create tables
create table public.shops (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text,
  phone text,
  owner_id uuid, -- will add fk later
  plan text default 'basic',
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  phone text,
  role text not null check (role in ('super_admin', 'admin', 'worker', 'customer')),
  shop_id uuid references public.shops(id),
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add foreign key back to shops
alter table public.shops add constraint fk_owner foreign key (owner_id) references public.profiles(id);

create table public.visits (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.profiles(id),
  worker_id uuid references public.profiles(id),
  shop_id uuid references public.shops(id) not null,
  car_plate text not null,
  car_model text,
  service text not null,
  status text default 'waiting' check (status in ('waiting','washing','drying','ready','delivered')),
  estimated_time text,
  photos jsonb,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.service_packages (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) not null,
  name text not null,
  description text,
  price numeric not null,
  duration_minutes integer,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  visit_id uuid references public.visits(id) not null,
  amount numeric not null,
  payment_method text check (payment_method in ('cash','upi','card')),
  status text default 'pending' check(status in ('pending','paid')),
  paid_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.profiles(id) not null,
  shop_id uuid references public.shops(id) not null,
  service text not null,
  date text not null,
  time text not null,
  status text default 'pending' check(status in ('pending','confirmed','cancelled')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.memberships (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.profiles(id) not null,
  shop_id uuid references public.shops(id) not null,
  plan_name text not null,
  washes_total integer,
  washes_used integer default 0,
  loyalty_points integer default 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  type text not null,
  channel text check(channel in ('sms','push','email')),
  message text,
  status text default 'sent',
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  visit_id uuid references public.visits(id) not null,
  customer_id uuid references public.profiles(id) not null,
  shop_id uuid references public.shops(id) not null,
  rating integer check(rating between 1 and 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.invites (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  token text unique not null,
  status text default 'pending' check(status in ('pending','accepted','expired','revoked')),
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null,
  accepted_at timestamp with time zone
);

-- 3. Turn on Row Level Security
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.visits enable row level security;
alter table public.service_packages enable row level security;
alter table public.invoices enable row level security;
alter table public.appointments enable row level security;
alter table public.memberships enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.invites enable row level security;

-- 4. Set up Policies
create policy "Profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check ((select auth.uid()) = id);
create policy "Users can update own profile." on public.profiles for update using ((select auth.uid()) = id);

create policy "Shops are viewable by everyone." on public.shops for select using (true);
create policy "Authenticated users can insert shops." on public.shops for insert with check (auth.role() = 'authenticated');
create policy "Shop owners can update." on public.shops for update using ((select auth.uid()) = owner_id);

create policy "Visits are viewable by everyone." on public.visits for select using (true);
create policy "Authenticated users can insert visits." on public.visits for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update visits." on public.visits for update using (auth.role() = 'authenticated');

create policy "Service packages are viewable by everyone." on public.service_packages for select using (true);
create policy "Authenticated users can insert service packages." on public.service_packages for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update service packages." on public.service_packages for update using (auth.role() = 'authenticated');

create policy "Invoices are viewable by everyone." on public.invoices for select using (true);
create policy "Authenticated users can insert invoices." on public.invoices for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update invoices." on public.invoices for update using (auth.role() = 'authenticated');

create policy "Appointments are viewable by everyone." on public.appointments for select using (true);
create policy "Authenticated users can update appointments." on public.appointments for update using (auth.role() = 'authenticated');

create policy "Memberships are viewable by everyone." on public.memberships for select using (true);

create policy "Notifications are viewable by everyone." on public.notifications for select using (true);

create policy "Reviews are viewable by everyone." on public.reviews for select using (true);

create policy "Invites are viewable by everyone." on public.invites for select using (true);


-- 5. Enable Realtime for visits
alter publication supabase_realtime add table public.visits;

-- 6. Optional: Trigger for automatically creating a profile for new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', 'Unknown'), 
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
