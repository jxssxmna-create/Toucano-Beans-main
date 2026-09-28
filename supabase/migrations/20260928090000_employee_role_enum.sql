-- Must run in its own transaction before the value is referenced.
alter type public.user_role add value if not exists 'employee';
