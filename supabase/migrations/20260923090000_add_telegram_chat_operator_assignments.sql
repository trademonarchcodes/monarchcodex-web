create table if not exists public.telegram_chat_assignments (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id bigint not null unique references public.telegram_chats(telegram_chat_id) on delete cascade,
  operator_user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists idx_telegram_chat_assignments_operator
  on public.telegram_chat_assignments(operator_user_id, active);

create table if not exists public.telegram_operator_limits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  max_managed_chats integer not null default 1 check (max_managed_chats between 1 and 10),
  updated_at timestamptz not null default now()
);

alter table public.telegram_chat_assignments enable row level security;
alter table public.telegram_operator_limits enable row level security;

drop policy if exists telegram_chat_assignments_select on public.telegram_chat_assignments;
create policy telegram_chat_assignments_select
on public.telegram_chat_assignments
for select to authenticated
using (is_monarch_admin() or operator_user_id = auth.uid());

drop policy if exists telegram_chat_assignments_admin_manage on public.telegram_chat_assignments;
create policy telegram_chat_assignments_admin_manage
on public.telegram_chat_assignments
for all to authenticated
using (is_monarch_admin())
with check (is_monarch_admin());

drop policy if exists telegram_operator_limits_select on public.telegram_operator_limits;
create policy telegram_operator_limits_select
on public.telegram_operator_limits
for select to authenticated
using (is_monarch_admin() or user_id = auth.uid());

drop policy if exists telegram_operator_limits_admin_manage on public.telegram_operator_limits;
create policy telegram_operator_limits_admin_manage
on public.telegram_operator_limits
for all to authenticated
using (is_monarch_admin())
with check (is_monarch_admin());

insert into public.telegram_operator_limits(user_id,max_managed_chats)
select id, case when lower(email)='trademonarchofficial@gmail.com' then 2 else 1 end
from public.profiles
where lower(coalesce(role,'')) like '%admin%'
   or lower(coalesce(role,'')) in ('sovereign_desk','sovereign-desk')
on conflict (user_id) do update
set max_managed_chats=excluded.max_managed_chats,
    updated_at=now();
