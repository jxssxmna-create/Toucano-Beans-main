create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text,
  slug text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.recipe_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text,
  slug text not null unique,
  show_calculator boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.recipes add column if not exists equipment_id uuid references public.equipment(id) on delete cascade;
alter table public.recipes add column if not exists method_id uuid references public.recipe_methods(id) on delete cascade;
alter table public.recipes add column if not exists default_ratio integer not null default 15;
alter table public.recipes add column if not exists default_dose_g integer not null default 15;
alter table public.recipes add column if not exists ratio_min integer not null default 12;
alter table public.recipes add column if not exists ratio_max integer not null default 18;
alter table public.recipes add column if not exists dose_min integer not null default 8;
alter table public.recipes add column if not exists dose_max integer not null default 40;
alter table public.recipes add column if not exists iced_hot_share numeric not null default 0.60;
alter table public.recipes add column if not exists grind_en text;
alter table public.recipes add column if not exists grind_ar text;
alter table public.recipes add column if not exists steps_hot_en text;
alter table public.recipes add column if not exists steps_hot_ar text;
alter table public.recipes add column if not exists steps_iced_en text;
alter table public.recipes add column if not exists steps_iced_ar text;
alter table public.recipes add column if not exists is_active boolean not null default true;

create unique index if not exists recipes_equipment_method_uidx
  on public.recipes (equipment_id, method_id)
  where equipment_id is not null and method_id is not null;

alter table public.equipment enable row level security;
alter table public.recipe_methods enable row level security;

drop policy if exists "Public read active equipment" on public.equipment;
create policy "Public read active equipment" on public.equipment for select using (is_active);

drop policy if exists "Admins read all equipment" on public.equipment;
create policy "Admins read all equipment" on public.equipment for select to authenticated using (public.is_admin());

drop policy if exists "Admins manage equipment" on public.equipment;
create policy "Admins manage equipment" on public.equipment for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read active methods" on public.recipe_methods;
create policy "Public read active methods" on public.recipe_methods for select using (is_active);

drop policy if exists "Admins read all methods" on public.recipe_methods;
create policy "Admins read all methods" on public.recipe_methods for select to authenticated using (public.is_admin());

drop policy if exists "Admins manage methods" on public.recipe_methods;
create policy "Admins manage methods" on public.recipe_methods for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.equipment (name, name_ar, slug, sort_order) values
  ('Hand Grinder (Comandante / Timemore)', 'مطحنة يدوية (كومانانتي / تايمور)', 'hand', 1),
  ('Electric Grinder (Fellow Ode / Baratza Encore)', 'مطحنة كهربائية (Fellow Ode / Baratza Encore)', 'electric', 2),
  ('Pre-Ground Coffee', 'بن مطحون جاهز', 'preground', 3)
on conflict (slug) do nothing;

insert into public.recipe_methods (name, name_ar, slug, show_calculator, sort_order) values
  ('V60 Pour Over', 'تقطير V60', 'v60', true, 1),
  ('Aeropress', 'إيروبرس', 'aeropress', false, 2),
  ('French Press', 'فرنش برس', 'french-press', false, 3),
  ('Espresso', 'إسبريسو', 'espresso', false, 4),
  ('Disc Drip Bag', 'كيس دريب القرص', 'drip-bag', false, 5)
on conflict (slug) do nothing;

insert into public.recipes (
  title, body, equipment_id, method_id, default_ratio, default_dose_g, iced_hot_share,
  grind_en, grind_ar, steps_hot_en, steps_hot_ar, steps_iced_en, steps_iced_ar, display_order
)
select
  e.name || ' · ' || m.name, '', e.id, m.id, v.default_ratio, v.default_dose_g, v.iced_hot_share,
  v.grind_en, v.grind_ar, v.steps_hot_en, v.steps_hot_ar, v.steps_iced_en, v.steps_iced_ar, v.sort_order
from (values
  ('hand','v60',15,15,0.60,1,
   'Comandante 18–22 clicks · Timemore C2 15–18 clicks (medium-fine)',
   'كومانانتي 18–22 نقرة · تايمور C2 15–18 نقرة (متوسط ناعم)',
   E'Rinse the filter and preheat the server. Discard the rinse water.\nAdd {coffee} coffee and level the bed.\nBloom: pour {bloom} water at 92–96°C and wait 30–45 seconds.\nFirst pour: take the scale to {mid} by 1:15.\nSecond pour: finish at {hotWater} by 2:00.\nLet drawdown finish between 2:30 and 3:30, swirl, and serve.',
   E'اشطف الفلتر وسخّن الوعاء. أفرغ ماء الشطف.\nأضف {coffee} بن ومهّد السطح.\nالتزهير: صب {bloom} ماء عند 92–96°م وانتظر 30–45 ثانية.\nالصب الأول: أوصل الوزن إلى {mid} حتى الدقيقة 1:15.\nالصب الثاني: أكمل إلى {hotWater} حتى الدقيقة 2:00.\nاترك التقطير ينتهي بين 2:30 و3:30 ثم حرّك وقدّم.',
   E'Add {ice} of ice to the serving vessel.\nRinse the paper filter over the sink so meltwater does not dilute the ice.\nAdd {coffee} coffee and level the bed.\nBloom: pour {bloom} water at 92–94°C and wait 30–45 seconds.\nContinue pouring to {hotWater} hot water in two pulses by 2:00.\nGently swirl the server to melt the ice and serve when drawdown finishes.',
   E'ضع {ice} ثلج في إبريق التقديم.\nاشطف ورقة الفلتر فوق المغسلة حتى لا يذوب الثلج.\nأضف {coffee} بن ومهّد السطح.\nالتزهير: صب {bloom} ماء عند 92–94°م وانتظر 30–45 ثانية.\nأكمل الصب حتى {hotWater} ماء ساخن على دفعتين حتى الدقيقة 2:00.\nحرّك الإبريق بلطف ليذوب الثلج وقدّم فور انتهاء التقطير.'),
  ('hand','aeropress',14,15,0.625,2,
   'Comandante 16–20 clicks · Timemore C2 13–16 clicks (fine-medium)',
   'كومانانتي 16–20 نقرة · تايمور C2 13–16 نقرة (ناعم إلى متوسط)',
   E'Assemble the Aeropress with a rinsed paper (standard position).\nAdd {coffee} coffee, then pour {hotWater} water at 85–92°C.\nStir for 8 seconds and steep 60–90 seconds.\nPress gently for 20–30 seconds and stop at the hiss.\nServe as-is, or top with a splash of hot water to taste.',
   E'ركّب الإيروبرس وضع الفلتر المبلل (الوضع العادي).\nأضف {coffee} بن ثم صب {hotWater} ماء عند 85–92°م.\nحرّك 8 ثوانٍ وانتظر 60–90 ثانية.\nاضغط بلطف لمدة 20–30 ثانية وتوقف عند صوت الفقاعات.\nقدّم فوراً أو خفّف بقليل من الماء الساخن حسب الرغبة.',
   E'Add {ice} of ice to the cup.\nAssemble the Aeropress with a rinsed paper (standard position).\nAdd {coffee} coffee, then pour {hotWater} water at 85–90°C.\nStir for 5 seconds and steep 60 seconds.\nPress gently for 20–30 seconds over the ice and serve.',
   E'ضع {ice} ثلج في الكوب.\nركّب الإيروبرس وضع الفلتر المبلل (الوضع العادي).\nأضف {coffee} بن ثم صب {hotWater} ماء عند 85–90°م.\nحرّك 5 ثوانٍ وانتظر 60 ثانية.\nاضغط بلطف لمدة 20–30 ثانية فوق الثلج وقدّم.'),
  ('hand','french-press',15,15,0.60,3,
   'Comandante 28–32 clicks · Timemore C2 22–26 clicks (coarse)',
   'كومانانتي 28–32 نقرة · تايمور C2 22–26 نقرة (خشن)',
   E'Preheat the carafe, then add {coffee} coarse coffee.\nPour {hotWater} water at 94°C and stir once.\nRest the lid on top without plunging and steep 4 minutes.\nBreak the crust and skim foam if you like.\nPlunge slowly and pour immediately.',
   E'سخّن الدورق ثم أضف {coffee} بن خشن.\nصب {hotWater} ماء عند 94°م وحرّك مرة واحدة.\nضع الغطاء دون ضغط وانقع 4 دقائق.\nاكسر القشرة واغرف الرغوة إن أحببت.\nاغمر المكبس ببطء وصب فوراً.',
   E'Add {ice} of ice to a serving jug.\nAdd {coffee} coarse coffee to the carafe.\nPour {hotWater} water at 94°C, stir once, and steep 4 minutes.\nBreak the crust, then plunge slowly.\nDecant immediately over the ice so it does not keep extracting.',
   E'ضع {ice} ثلج في إبريق التقديم.\nأضف {coffee} بن خشن إلى الدورق.\nصب {hotWater} ماء عند 94°م، حرّك بلطف، وانقع 4 دقائق.\nاكسر القشرة ثم اغمر المكبس ببطء.\nصب فوراً فوق الثلج حتى لا تستمر المرارة.'),
  ('hand','espresso',2,18,1.00,4,
   'Comandante 8–12 clicks · Timemore C2 8–10 clicks (fine, dial in)',
   'كومانانتي 8–12 نقرة · تايمور C2 8–10 نقرات (ناعم، اضبط حسب الطعم)',
   E'Grind {coffee} very fine and distribute in the basket.\nTarget {hotWater} in the cup in 25–32 seconds (1:{ratio} ratio).\nServe immediately, or add hot water for an Americano.\nIf bitter, grind coarser or shorten the shot; if sour, grind finer.',
   E'اطحن {coffee} ناعم جداً ووزّعها في السلة.\nاستهدف {hotWater} في الكوب خلال 25–32 ثانية (نسبة 1:{ratio}).\nقدّم فوراً، أو أضف ماء ساخناً لأمريكانو.\nإن كان مراً اطحن أخشن أو قصّر الوقت؛ إن كان حامضاً اطحن أنعم.',
   E'Grind {coffee} very fine and distribute in the basket.\nTarget {hotWater} espresso in 25–32 seconds.\nPour over a glass of ice, or build an iced milk drink.\nIf it tastes hollow, shorten the ratio; if sour, grind finer.',
   E'اطحن {coffee} ناعم جداً ووزّعها في السلة.\nاستهدف {hotWater} إسبريسو خلال 25–32 ثانية.\nصب مباشرة فوق كوب فيه ثلج، أو ابنِ مشروباً مثلجاً بالحليب.\nإن كان بارداً جداً قصّر النسبة قليلاً؛ إن كان حامضاً اطحن أنعم.'),
  ('hand','drip-bag',15,12,0.60,5,
   'Comandante 20–24 clicks · Timemore C2 16–20 clicks (medium)',
   'كومانانتي 20–24 نقرة · تايمور C2 16–20 نقرة (متوسط)',
   E'Open the lid carefully.\nPlace the filter disc on the cup.\nPour 75ml — 75ml — 75ml, waiting 15 seconds between pours.\nRemove the disc and enjoy.',
   E'افتح الغطاء بعناية.\nضع قرص الفلتر أعلى الكوب.\nصب 75مل — 75مل — 75مل وانتظر 15 ثانية بين كل صب.\nأزل القرص واستمتع بقهوتك.',
   E'Open the lid carefully.\nAdd 110g of ice to the cup.\nPlace the filter disc on the cup.\nPour 60ml of 92°C water.\nWait 30 seconds, then pour 55ml and wait 20 seconds.\nRemove the disc and enjoy.',
   E'افتح الغطاء بعناية.\nأضف 110غ ثلج إلى الكوب.\nضع قرص الفلتر أعلى الكوب.\nصب 60مل ماء ساخن عند 92°م.\nانتظر 30 ثانية ثم صب 55مل وانتظر 20 ثانية.\nأزل القرص واستمتع بقهوتك.'),
  ('electric','v60',15,15,0.60,6,
   'Fellow Ode 4–5 · Baratza Encore 15–18 (medium-fine)',
   'Fellow Ode 4–5 · Baratza Encore 15–18 (متوسط ناعم)',
   E'Rinse the filter and preheat the server. Discard the rinse water.\nAdd {coffee} coffee and level the bed.\nBloom: pour {bloom} water at 92–96°C and wait 30–45 seconds.\nFirst pour: take the scale to {mid} by 1:15.\nSecond pour: finish at {hotWater} by 2:00.\nLet drawdown finish between 2:30 and 3:30, swirl, and serve.',
   E'اشطف الفلتر وسخّن الوعاء. أفرغ ماء الشطف.\nأضف {coffee} بن ومهّد السطح.\nالتزهير: صب {bloom} ماء عند 92–96°م وانتظر 30–45 ثانية.\nالصب الأول: أوصل الوزن إلى {mid} حتى الدقيقة 1:15.\nالصب الثاني: أكمل إلى {hotWater} حتى الدقيقة 2:00.\nاترك التقطير ينتهي بين 2:30 و3:30 ثم حرّك وقدّم.',
   E'Add {ice} of ice to the serving vessel.\nRinse the paper filter over the sink so meltwater does not dilute the ice.\nAdd {coffee} coffee and level the bed.\nBloom: pour {bloom} water at 92–94°C and wait 30–45 seconds.\nContinue pouring to {hotWater} hot water in two pulses by 2:00.\nGently swirl the server to melt the ice and serve when drawdown finishes.',
   E'ضع {ice} ثلج في إبريق التقديم.\nاشطف ورقة الفلتر فوق المغسلة حتى لا يذوب الثلج.\nأضف {coffee} بن ومهّد السطح.\nالتزهير: صب {bloom} ماء عند 92–94°م وانتظر 30–45 ثانية.\nأكمل الصب حتى {hotWater} ماء ساخن على دفعتين حتى الدقيقة 2:00.\nحرّك الإبريق بلطف ليذوب الثلج وقدّم فور انتهاء التقطير.'),
  ('electric','aeropress',14,15,0.625,7,
   'Fellow Ode 3–4 · Baratza Encore 12–15 (fine-medium)',
   'Fellow Ode 3–4 · Baratza Encore 12–15 (ناعم إلى متوسط)',
   E'Assemble the Aeropress with a rinsed paper (standard position).\nAdd {coffee} coffee, then pour {hotWater} water at 85–92°C.\nStir for 8 seconds and steep 60–90 seconds.\nPress gently for 20–30 seconds and stop at the hiss.\nServe as-is, or top with a splash of hot water to taste.',
   E'ركّب الإيروبرس وضع الفلتر المبلل (الوضع العادي).\nأضف {coffee} بن ثم صب {hotWater} ماء عند 85–92°م.\nحرّك 8 ثوانٍ وانتظر 60–90 ثانية.\nاضغط بلطف لمدة 20–30 ثانية وتوقف عند صوت الفقاعات.\nقدّم فوراً أو خفّف بقليل من الماء الساخن حسب الرغبة.',
   E'Add {ice} of ice to the cup.\nAssemble the Aeropress with a rinsed paper (standard position).\nAdd {coffee} coffee, then pour {hotWater} water at 85–90°C.\nStir for 5 seconds and steep 60 seconds.\nPress gently for 20–30 seconds over the ice and serve.',
   E'ضع {ice} ثلج في الكوب.\nركّب الإيروبرس وضع الفلتر المبلل (الوضع العادي).\nأضف {coffee} بن ثم صب {hotWater} ماء عند 85–90°م.\nحرّك 5 ثوانٍ وانتظر 60 ثانية.\nاضغط بلطف لمدة 20–30 ثانية فوق الثلج وقدّم.'),
  ('electric','french-press',15,15,0.60,8,
   'Fellow Ode 7–8 · Baratza Encore 28–32 (coarse)',
   'Fellow Ode 7–8 · Baratza Encore 28–32 (خشن)',
   E'Preheat the carafe, then add {coffee} coarse coffee.\nPour {hotWater} water at 94°C and stir once.\nRest the lid on top without plunging and steep 4 minutes.\nBreak the crust and skim foam if you like.\nPlunge slowly and pour immediately.',
   E'سخّن الدورق ثم أضف {coffee} بن خشن.\nصب {hotWater} ماء عند 94°م وحرّك مرة واحدة.\nضع الغطاء دون ضغط وانقع 4 دقائق.\nاكسر القشرة واغرف الرغوة إن أحببت.\nاغمر المكبس ببطء وصب فوراً.',
   E'Add {ice} of ice to a serving jug.\nAdd {coffee} coarse coffee to the carafe.\nPour {hotWater} water at 94°C, stir once, and steep 4 minutes.\nBreak the crust, then plunge slowly.\nDecant immediately over the ice so it does not keep extracting.',
   E'ضع {ice} ثلج في إبريق التقديم.\nأضف {coffee} بن خشن إلى الدورق.\nصب {hotWater} ماء عند 94°م، حرّك بلطف، وانقع 4 دقائق.\nاكسر القشرة ثم اغمر المكبس ببطء.\nصب فوراً فوق الثلج حتى لا تستمر المرارة.'),
  ('electric','drip-bag',15,12,0.60,9,
   'Fellow Ode 5 · Baratza Encore 18 (medium)',
   'Fellow Ode 5 · Baratza Encore 18 (متوسط)',
   E'Open the lid carefully.\nPlace the filter disc on the cup.\nPour 75ml — 75ml — 75ml, waiting 15 seconds between pours.\nRemove the disc and enjoy.',
   E'افتح الغطاء بعناية.\nضع قرص الفلتر أعلى الكوب.\nصب 75مل — 75مل — 75مل وانتظر 15 ثانية بين كل صب.\nأزل القرص واستمتع بقهوتك.',
   E'Open the lid carefully.\nAdd 110g of ice to the cup.\nPlace the filter disc on the cup.\nPour 60ml of 92°C water.\nWait 30 seconds, then pour 55ml and wait 20 seconds.\nRemove the disc and enjoy.',
   E'افتح الغطاء بعناية.\nأضف 110غ ثلج إلى الكوب.\nضع قرص الفلتر أعلى الكوب.\nصب 60مل ماء ساخن عند 92°م.\nانتظر 30 ثانية ثم صب 55مل وانتظر 20 ثانية.\nأزل القرص واستمتع بقهوتك.'),
  ('preground','aeropress',14,15,0.625,10,
   'Use a medium pre-ground bag, or the “filter” grind from Toucano Beans',
   'استخدم بنّاً مطحوناً بدرجة متوسطة، أو طحن «فلتر» من توكانو بينز',
   E'Assemble the Aeropress with a rinsed paper (standard position).\nAdd {coffee} coffee, then pour {hotWater} water at 85–92°C.\nStir for 8 seconds and steep 60–90 seconds.\nPress gently for 20–30 seconds and stop at the hiss.\nServe as-is, or top with a splash of hot water to taste.',
   E'ركّب الإيروبرس وضع الفلتر المبلل (الوضع العادي).\nأضف {coffee} بن ثم صب {hotWater} ماء عند 85–92°م.\nحرّك 8 ثوانٍ وانتظر 60–90 ثانية.\nاضغط بلطف لمدة 20–30 ثانية وتوقف عند صوت الفقاعات.\nقدّم فوراً أو خفّف بقليل من الماء الساخن حسب الرغبة.',
   E'Add {ice} of ice to the cup.\nAssemble the Aeropress with a rinsed paper (standard position).\nAdd {coffee} coffee, then pour {hotWater} water at 85–90°C.\nStir for 5 seconds and steep 60 seconds.\nPress gently for 20–30 seconds over the ice and serve.',
   E'ضع {ice} ثلج في الكوب.\nركّب الإيروبرس وضع الفلتر المبلل (الوضع العادي).\nأضف {coffee} بن ثم صب {hotWater} ماء عند 85–90°م.\nحرّك 5 ثوانٍ وانتظر 60 ثانية.\nاضغط بلطف لمدة 20–30 ثانية فوق الثلج وقدّم.'),
  ('preground','french-press',15,15,0.60,11,
   'Use a coarse pre-ground bag labelled French press / cafetière',
   'استخدم بنّاً مطحوناً خشناً مخصصاً للفرنش برس',
   E'Preheat the carafe, then add {coffee} coarse coffee.\nPour {hotWater} water at 94°C and stir once.\nRest the lid on top without plunging and steep 4 minutes.\nBreak the crust and skim foam if you like.\nPlunge slowly and pour immediately.',
   E'سخّن الدورق ثم أضف {coffee} بن خشن.\nصب {hotWater} ماء عند 94°م وحرّك مرة واحدة.\nضع الغطاء دون ضغط وانقع 4 دقائق.\nاكسر القشرة واغرف الرغوة إن أحببت.\nاغمر المكبس ببطء وصب فوراً.',
   E'Add {ice} of ice to a serving jug.\nAdd {coffee} coarse coffee to the carafe.\nPour {hotWater} water at 94°C, stir once, and steep 4 minutes.\nBreak the crust, then plunge slowly.\nDecant immediately over the ice so it does not keep extracting.',
   E'ضع {ice} ثلج في إبريق التقديم.\nأضف {coffee} بن خشن إلى الدورق.\nصب {hotWater} ماء عند 94°م، حرّك بلطف، وانقع 4 دقائق.\nاكسر القشرة ثم اغمر المكبس ببطء.\nصب فوراً فوق الثلج حتى لا تستمر المرارة.'),
  ('preground','drip-bag',15,12,0.60,12,
   'Use the grind already in the Toucano Beans drip disc — no extra grinding',
   'استخدم الطحن الموجود داخل قرص دريب توكانو بينز — لا تحتاج طحناً إضافياً',
   E'Open the lid carefully.\nPlace the filter disc on the cup.\nPour 75ml — 75ml — 75ml, waiting 15 seconds between pours.\nRemove the disc and enjoy.',
   E'افتح الغطاء بعناية.\nضع قرص الفلتر أعلى الكوب.\nصب 75مل — 75مل — 75مل وانتظر 15 ثانية بين كل صب.\nأزل القرص واستمتع بقهوتك.',
   E'Open the lid carefully.\nAdd 110g of ice to the cup.\nPlace the filter disc on the cup.\nPour 60ml of 92°C water.\nWait 30 seconds, then pour 55ml and wait 20 seconds.\nRemove the disc and enjoy.',
   E'افتح الغطاء بعناية.\nأضف 110غ ثلج إلى الكوب.\nضع قرص الفلتر أعلى الكوب.\nصب 60مل ماء ساخن عند 92°م.\nانتظر 30 ثانية ثم صب 55مل وانتظر 20 ثانية.\nأزل القرص واستمتع بقهوتك.')
) as v(eq_slug, method_slug, default_ratio, default_dose_g, iced_hot_share, sort_order, grind_en, grind_ar, steps_hot_en, steps_hot_ar, steps_iced_en, steps_iced_ar)
join public.equipment e on e.slug = v.eq_slug
join public.recipe_methods m on m.slug = v.method_slug
where not exists (
  select 1 from public.recipes r where r.equipment_id = e.id and r.method_id = m.id
);

update public.recipes
set ratio_min = 1, ratio_max = 3
where method_id in (select id from public.recipe_methods where slug = 'espresso');
