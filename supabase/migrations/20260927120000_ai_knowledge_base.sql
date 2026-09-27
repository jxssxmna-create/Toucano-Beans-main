-- AI Barista knowledge base
create table if not exists public.ai_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'general',
  title text not null,
  content text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_knowledge_base_category_idx on public.ai_knowledge_base (category);

create or replace function public.touch_ai_knowledge_base()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_ai_knowledge_base on public.ai_knowledge_base;
create trigger trg_touch_ai_knowledge_base before update on public.ai_knowledge_base
  for each row execute function public.touch_ai_knowledge_base();

alter table public.ai_knowledge_base enable row level security;

drop policy if exists "Anyone can read active knowledge" on public.ai_knowledge_base;
create policy "Anyone can read active knowledge" on public.ai_knowledge_base
  for select using (is_active);

drop policy if exists "Admins manage knowledge" on public.ai_knowledge_base;
create policy "Admins manage knowledge" on public.ai_knowledge_base
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.ai_knowledge_base (category, title, content)
select * from (values
  ('brewing', 'V60 pour-over setup', 'Essentials: Hario V60 dripper (size 02), V60 paper filters, gooseneck kettle, burr grinder, digital scale with timer, server or mug. Recipe: 15 g coffee, medium-fine grind, 250 g water at 92–94°C. Bloom with 40 g for 30–45 s, then pour in slow spirals to 250 g; total time 2:30–3:00.'),
  ('flavor_profiles', 'Fruity & floral beans', 'Ethiopian coffees (Guji, Yirgacheffe) are bright with berry, citrus, jasmine and stone-fruit notes. Best brewed as pour-over (V60) or light-roast filter.'),
  ('flavor_profiles', 'Chocolatey & nutty beans', 'Colombian and Brazilian coffees lean toward milk chocolate, caramel, hazelnut and a round body. Great for espresso, moka pot, French press and milk drinks.'),
  ('promotions', 'Loyalty stamps', 'Every order earns a stamp on the Toucano loyalty card. Collect 6 stamps to receive 1 free bag of coffee.')
) as seed(category, title, content)
where not exists (select 1 from public.ai_knowledge_base);
