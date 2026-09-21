-- Feature pack: sales analytics, saved addresses, recipes, gallery, loyalty, driver vehicle
alter table public.profiles
  add column if not exists vehicle_type text,
  add column if not exists vehicle_plate text,
  add column if not exists loyalty_stamps integer not null default 0,
  add column if not exists free_bag_vouchers integer not null default 0;

alter table public.profiles drop constraint if exists profiles_vehicle_type_check;
alter table public.profiles
  add constraint profiles_vehicle_type_check
  check (vehicle_type is null or vehicle_type in ('car', 'bike'));

alter table public.products
  add column if not exists image_urls text[] not null default '{}';

update public.products
set image_urls = array[image_url]
where image_url is not null and image_url <> ''
  and (image_urls is null or cardinality(image_urls) = 0);

alter table public.orders
  add column if not exists user_id uuid references public.profiles (id) on delete set null,
  add column if not exists total numeric(12,2) not null default 0,
  add column if not exists items jsonb not null default '[]'::jsonb,
  add column if not exists address_label text,
  add column if not exists address_snapshot jsonb;

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

create table if not exists public.saved_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  building_number text,
  street_number text,
  zone_number text,
  google_map_link text,
  lat numeric(10,7),
  lng numeric(10,7),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists saved_addresses_user_id_idx on public.saved_addresses (user_id);
alter table public.saved_addresses enable row level security;

drop policy if exists "Users manage own addresses" on public.saved_addresses;
create policy "Users manage own addresses"
  on public.saved_addresses for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  image_url text,
  display_order integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.recipes enable row level security;

drop policy if exists "Anyone can read recipes" on public.recipes;
create policy "Anyone can read recipes" on public.recipes for select using (true);

drop policy if exists "Admins manage recipes" on public.recipes;
create policy "Admins manage recipes"
  on public.recipes for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Buyers read own orders" on public.orders;
create policy "Buyers read own orders"
  on public.orders for select
  using (user_id = auth.uid() or public.is_admin() or public.is_delivery());

drop policy if exists "Buyers insert own orders" on public.orders;
create policy "Buyers insert own orders"
  on public.orders for insert
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins update any profile" on public.profiles;
create policy "Admins update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select
  using (public.is_admin() or id = auth.uid());
