-- Rename equipment → grinders
alter table if exists public.equipment rename to grinders;

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'recipes' and column_name = 'equipment_id'
  ) then
    alter table public.recipes rename column equipment_id to grinder_id;
  end if;
end $$;

drop index if exists public.recipes_equipment_method_uidx;
create unique index if not exists recipes_grinder_method_uidx
  on public.recipes (grinder_id, method_id)
  where grinder_id is not null and method_id is not null;

drop policy if exists "Public read active equipment" on public.grinders;
create policy "Public read active grinders" on public.grinders for select using (is_active);

drop policy if exists "Admins read all equipment" on public.grinders;
create policy "Admins read all grinders" on public.grinders for select to authenticated using (public.is_admin());

drop policy if exists "Admins manage equipment" on public.grinders;
create policy "Admins manage grinders" on public.grinders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table if not exists public.grinder_products (
  grinder_id uuid not null references public.grinders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (grinder_id, product_id)
);

create index if not exists grinder_products_product_idx on public.grinder_products (product_id);

alter table public.grinder_products enable row level security;

drop policy if exists "Public read grinder products" on public.grinder_products;
create policy "Public read grinder products" on public.grinder_products for select using (true);

drop policy if exists "Admins manage grinder products" on public.grinder_products;
create policy "Admins manage grinder products" on public.grinder_products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
