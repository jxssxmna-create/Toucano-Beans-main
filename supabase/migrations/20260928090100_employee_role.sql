-- Employee role (@toucano.com): orders view, stock toggles, item substitution, loyalty lookup
alter table public.products add column if not exists in_stock boolean not null default true;
alter table public.orders add column if not exists substitutions jsonb not null default '[]'::jsonb;

create or replace function public.is_employee()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'employee'::public.user_role);
$$;
revoke execute on function public.is_employee() from public, anon;
grant execute on function public.is_employee() to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  assigned_role public.user_role := 'buyer';
begin
  if new.email ilike '%@admin.com' then
    assigned_role := 'admin';
  elsif new.email ilike '%@delivery.com' or new.email ilike '%@deliver.com' then
    assigned_role := 'delivery';
  elsif new.email ilike '%@toucano.com' then
    assigned_role := 'employee';
  end if;

  insert into public.profiles (id, email, full_name, phone_number, role)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'phone_number', '')), ''), new.phone),
    assigned_role
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    phone_number = coalesce(public.profiles.phone_number, excluded.phone_number),
    role = case
      when excluded.email ilike '%@admin.com' then 'admin'::public.user_role
      when excluded.email ilike '%@delivery.com' or excluded.email ilike '%@deliver.com' then 'delivery'::public.user_role
      when excluded.email ilike '%@toucano.com' then 'employee'::public.user_role
      else public.profiles.role
    end,
    updated_at = timezone('utc'::text, now());
  return new;
end $$;

update public.profiles set role = 'employee' where email ilike '%@toucano.com' and role = 'buyer';

drop policy if exists "Employees read all orders" on public.orders;
create policy "Employees read all orders" on public.orders
  for select to authenticated using (public.is_employee());

create or replace function public.set_product_stock(p_product_id uuid, p_in_stock boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_employee() or public.is_admin()) then
    raise exception 'Not authorised';
  end if;
  update public.products set in_stock = p_in_stock where id = p_product_id;
  if not found then raise exception 'Product not found'; end if;
end $$;

-- Swap (p_product_id), adjust qty (p_qty) or remove (p_qty = 0) one line of a pending order.
create or replace function public.employee_adjust_order_item(
  p_order_id uuid,
  p_index int,
  p_product_id uuid default null,
  p_qty int default null,
  p_note text default null
)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_items jsonb;
  v_old jsonb;
  v_new jsonb;
  v_prod public.products;
  v_old_line numeric;
  v_new_line numeric := 0;
  v_qty int;
  v_action text;
begin
  if not (public.is_employee() or public.is_admin()) then
    raise exception 'Not authorised';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status <> 'pending' then raise exception 'Only pending orders can be changed'; end if;

  v_items := coalesce(v_order.items, '[]'::jsonb);
  if p_index is null or p_index < 0 or p_index >= jsonb_array_length(v_items) then
    raise exception 'Invalid item';
  end if;
  if p_qty is not null and (p_qty < 0 or p_qty > 99) then raise exception 'Invalid quantity'; end if;

  v_old := v_items -> p_index;
  v_old_line := coalesce((v_old->>'price')::numeric, 0) * coalesce((v_old->>'qty')::int, 1);
  v_qty := coalesce(p_qty, (v_old->>'qty')::int, 1);

  if p_product_id is not null then
    select * into v_prod from public.products where id = p_product_id;
    if not found then raise exception 'Product not found'; end if;
    if not v_prod.in_stock then raise exception 'Replacement product is out of stock'; end if;
    v_new := jsonb_build_object(
      'product_id', v_prod.id, 'name', v_prod.name, 'price', v_prod.price,
      'category', v_prod.category, 'qty', v_qty
    );
    v_action := 'substitute';
  else
    v_new := jsonb_set(v_old, '{qty}', to_jsonb(v_qty));
    v_action := 'adjust_qty';
  end if;

  if v_qty = 0 then
    v_items := v_items - p_index;
    v_action := 'remove';
  else
    v_items := jsonb_set(v_items, array[p_index::text], v_new);
    v_new_line := (v_new->>'price')::numeric * v_qty;
  end if;

  update public.orders set
    items = v_items,
    total = greatest(0, coalesce(v_order.total, 0) - v_old_line + v_new_line),
    substitutions = coalesce(v_order.substitutions, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'at', now(), 'by', auth.uid(), 'action', v_action, 'from', v_old,
      'to', case when v_qty = 0 then null else v_new end,
      'note', nullif(trim(coalesce(p_note, '')), '')
    )),
    updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end $$;

create or replace function public.employee_customer_loyalty(p_user_ids uuid[])
returns table (user_id uuid, full_name text, email text, loyalty_stamps int, free_bag_vouchers int)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.email, coalesce(p.loyalty_stamps, 0), coalesce(p.free_bag_vouchers, 0)
  from public.profiles p
  where p.id = any (p_user_ids) and (public.is_employee() or public.is_admin());
$$;

revoke execute on function public.set_product_stock(uuid, boolean) from public, anon;
revoke execute on function public.employee_adjust_order_item(uuid, int, uuid, int, text) from public, anon;
revoke execute on function public.employee_customer_loyalty(uuid[]) from public, anon;
grant execute on function public.set_product_stock(uuid, boolean) to authenticated;
grant execute on function public.employee_adjust_order_item(uuid, int, uuid, int, text) to authenticated;
grant execute on function public.employee_customer_loyalty(uuid[]) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'orders') then
      alter publication supabase_realtime add table public.orders;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'products') then
      alter publication supabase_realtime add table public.products;
    end if;
  end if;
end $$;
