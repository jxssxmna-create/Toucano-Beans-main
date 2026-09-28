-- Product weight + EN/AR localisation (existing name/description/title/body columns are the English source)
alter table public.products add column if not exists weight text;
alter table public.products add column if not exists name_ar text;
alter table public.products add column if not exists description_ar text;

alter table public.recipes add column if not exists title_ar text;
alter table public.recipes add column if not exists body_ar text;

update public.products set weight = '250g' where category = 'coffee-beans' and weight is null;
update public.products set weight = '10 × 12g Drip Bags' where name in ('Signature Drip Box', 'Dark Roast Drip Box') and weight is null;
update public.products set weight = '8 × 12g Drip Bags' where name in ('Ethiopia Drip Pack', 'Colombia Drip Pack') and weight is null;

update public.products p set name_ar = v.ar
from (values
  ('Yirgacheffe', 'يرغاتشيفي'),
  ('Guji', 'غوجي'),
  ('Colombia', 'كولومبيا'),
  ('Brazil Cerrado', 'البرازيل سيرادو'),
  ('Kenya AA', 'كينيا AA'),
  ('Signature Drip Box', 'صندوق الدريب المميز'),
  ('Dark Roast Drip Box', 'صندوق دريب التحميص الداكن'),
  ('Ethiopia Drip Pack', 'باقة دريب إثيوبيا'),
  ('Colombia Drip Pack', 'باقة دريب كولومبيا'),
  ('Pour-Over Kettle', 'غلاية التقطير'),
  ('Manual Coffee Grinder', 'مطحنة قهوة يدوية'),
  ('Ceramic Pour-Over Dripper', 'قمع تقطير سيراميك'),
  ('Brew Scale', 'ميزان التحضير'),
  ('Paper Filters (100 pcs)', 'فلاتر ورقية (100 قطعة)')
) as v(en, ar)
where p.name = v.en and p.name_ar is null;
