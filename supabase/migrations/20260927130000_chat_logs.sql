-- AI Barista: persistent chat history + preferred language
alter table public.profiles add column if not exists preferred_language text not null default 'en'
  check (preferred_language in ('en', 'ar'));

create table if not exists public.chat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  message text not null check (char_length(message) <= 8000),
  "timestamp" timestamptz not null default now()
);

create index if not exists chat_logs_user_ts_idx on public.chat_logs (user_id, "timestamp" desc);

alter table public.chat_logs enable row level security;

drop policy if exists "Users read own chat logs" on public.chat_logs;
create policy "Users read own chat logs" on public.chat_logs
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users insert own chat logs" on public.chat_logs;
create policy "Users insert own chat logs" on public.chat_logs
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Users delete own chat logs" on public.chat_logs;
create policy "Users delete own chat logs" on public.chat_logs
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());
