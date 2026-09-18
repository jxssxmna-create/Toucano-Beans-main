-- Products table (uuid), admin email bootstrap, storage bucket + RLS

-- Promote @admin.com accounts to admin role
update public.profiles
set role = 'admin'::public.user_role
where email ilike '%@admin.com'
  and role is distinct from 'admin'::public.user_role;

-- Signup trigger: @admin.com => admin
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role public.user_role := 'buyer';
begin
  if new.email ilike '%@admin.com' then
    assigned_role := 'admin';
  end if;

  insert into public.profiles (id, email, full_name, phone_number, role)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    coalesce(
      nullif(trim(coalesce(new.raw_user_meta_data->>'phone_number', '')), ''),
      new.phone
    ),
    assigned_role
  )
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      phone_number = coalesce(public.profiles.phone_number, excluded.phone_number),
      role = case
        when excluded.email ilike '%@admin.com' then 'admin'::public.user_role
        else public.profiles.role
      end,
      updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to postgres, service_role;

-- Rebuild products for admin catalog (0 existing rows)
drop table if exists public.products cascade;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(10, 2) not null check (price >= 0),
  category text not null check (category in ('coffee-beans', 'drip-coffee', 'essentials')),
  image_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index products_category_order_idx
  on public.products (category, display_order, created_at);

alter table public.products enable row level security;

drop policy if exists "Enable read access for all users" on public.products;
drop policy if exists "Public can read products" on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;

create policy "Public can read products"
  on public.products for select
  to anon, authenticated
  using (true);

create policy "Admins can insert products"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update products"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using (public.is_admin());

-- Storage bucket for product images (public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read product images" on storage.objects;
drop policy if exists "Admins upload product images" on storage.objects;
drop policy if exists "Admins update product images" on storage.objects;
drop policy if exists "Admins delete product images" on storage.objects;

create policy "Public read product images"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

create policy "Admins upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admins update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admins delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- Tighten is_admin RPC exposure (keep authenticated for RLS helpers)
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
