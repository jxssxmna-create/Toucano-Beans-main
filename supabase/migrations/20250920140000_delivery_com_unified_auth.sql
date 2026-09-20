-- Prefer @delivery.com for delivery role (legacy @deliver.com still supported)

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
  elsif new.email ilike '%@delivery.com' or new.email ilike '%@deliver.com' then
    assigned_role := 'delivery';
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
        when excluded.email ilike '%@delivery.com' or excluded.email ilike '%@deliver.com' then 'delivery'::public.user_role
        else public.profiles.role
      end,
      updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

update public.profiles
set role = 'delivery'::public.user_role
where (email ilike '%@delivery.com' or email ilike '%@deliver.com')
  and role is distinct from 'delivery'::public.user_role;
