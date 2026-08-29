create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'student',
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  guests integer not null default 1,
  booking_date date not null,
  booking_time text not null,
  class_title text not null,
  class_category text not null,
  price integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists bookings_user_idx on public.bookings (user_id);
create index if not exists bookings_email_idx on public.bookings (email);

alter table public.profiles enable row level security;
alter table public.bookings enable row level security;

create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can read their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can insert their own bookings"
on public.bookings
for insert
with check (auth.uid() = user_id);

create policy "Users can read their own bookings"
on public.bookings
for select
using (auth.uid() = user_id);

create policy "Users can update their own bookings"
on public.bookings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own bookings"
on public.bookings
for delete
using (auth.uid() = user_id);