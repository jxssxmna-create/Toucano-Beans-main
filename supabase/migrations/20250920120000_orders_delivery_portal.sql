-- Orders table for delivery portal

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone_number text not null,
  delivery_location text not null,
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'cancelled')),
  assigned_to uuid references public.profiles (id) on delete set null,
  notes text default '',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_assigned_to_idx on public.orders (assigned_to);

alter table public.orders enable row level security;

drop policy if exists "Admins manage orders" on public.orders;
drop policy if exists "Delivery view assigned or open pending" on public.orders;
drop policy if exists "Delivery mark delivered" on public.orders;
drop policy if exists "Buyers insert own orders" on public.orders;

create or replace function public.is_delivery()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'delivery'::public.user_role
  );
$$;

revoke all on function public.is_delivery() from public, anon;
grant execute on function public.is_delivery() to authenticated, service_role;

create policy "Admins manage orders"
  on public.orders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Delivery view assigned or open pending"
  on public.orders for select
  to authenticated
  using (
    public.is_delivery()
    and status = 'pending'
    and (assigned_to = auth.uid() or assigned_to is null)
  );

create policy "Delivery mark delivered"
  on public.orders for update
  to authenticated
  using (
    public.is_delivery()
    and status = 'pending'
    and (assigned_to = auth.uid() or assigned_to is null)
  )
  with check (
    public.is_delivery()
    and status in ('pending', 'delivered')
  );

-- Demo pending orders (idempotent seed)
insert into public.orders (customer_name, phone_number, delivery_location, status, notes)
select * from (values
  ('Sara Al-Thani', '+97455551234', 'West Bay, Doha', 'pending', 'Leave with reception'),
  ('Mohammed Hassan', '+97455559876', 'The Pearl, Doha', 'pending', 'Call on arrival'),
  ('Layla Ibrahim', '+97455554321', 'Katara Cultural Village, Doha', 'pending', 'Apartment 12B')
) as v(customer_name, phone_number, delivery_location, status, notes)
where not exists (select 1 from public.orders limit 1);
