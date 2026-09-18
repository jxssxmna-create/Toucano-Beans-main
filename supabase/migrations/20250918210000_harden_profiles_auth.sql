-- Migration: harden_profiles_auth
-- Creates/updates profiles, signup trigger, role protection, and RLS policies.

-- Roles enum (idempotent)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'delivery', 'buyer');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text default '',
  full_name text,
  phone_number text,
  role public.user_role not null default 'buyer',
  building_number text,
  street_number text,
  zone_number text,
  google_map_link text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists phone_number text,
  add column if not exists building_number text,
  add column if not exists street_number text,
  add column if not exists zone_number text,
  add column if not exists google_map_link text,
  add column if not exists updated_at timestamptz not null default timezone('utc'::text, now());

alter table public.profiles alter column email set default '';
alter table public.profiles alter column email drop not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone_number, role)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    coalesce(
      nullif(trim(coalesce(new.raw_user_meta_data->>'phone_number', '')), ''),
      new.phone
    ),
    'buyer'::public.user_role
  )
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      phone_number = coalesce(public.profiles.phone_number, excluded.phone_number),
      updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'::public.user_role
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'Profile id cannot be changed';
  end if;

  if new.role is distinct from old.role and auth.uid() is not null then
    if not public.is_admin() then
      raise exception 'Only admins can change user roles';
    end if;
  end if;

  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (
    auth.uid() = id
    and role = 'buyer'::public.user_role
  );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.protect_profile_columns() from public, anon, authenticated;
grant execute on function public.handle_new_user() to postgres, service_role;
grant execute on function public.protect_profile_columns() to postgres, service_role;
