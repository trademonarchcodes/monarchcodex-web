create table if not exists public.online_cooperative_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  package text,
  external_account_reference text,
  initial_contribution numeric not null default 0 check (initial_contribution >= 0),
  target_amount numeric not null default 0 check (target_amount >= 0),
  current_earnings numeric not null default 0 check (current_earnings >= 0),
  direct_referral_earnings numeric not null default 0 check (direct_referral_earnings >= 0),
  placement_earnings numeric not null default 0 check (placement_earnings >= 0),
  network_earnings numeric not null default 0 check (network_earnings >= 0),
  status text not null default 'pending_setup' check (status in ('pending_setup','active','target_reached','upgraded','inactive')),
  admin_note text,
  visible_to_member boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.online_cooperative_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  investment_id uuid not null unique references public.investments(id) on delete cascade,
  allocated_amount numeric not null default 10 check (allocated_amount > 0),
  status text not null default 'allocated' check (status in ('allocated','reversed')),
  created_at timestamptz not null default now(),
  reversed_at timestamptz
);

create table if not exists public.online_cooperative_audit_logs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.online_cooperative_accounts(id) on delete set null,
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.online_cooperative_accounts enable row level security;
alter table public.online_cooperative_allocations enable row level security;
alter table public.online_cooperative_audit_logs enable row level security;

create policy "cooperative_members_read_own" on public.online_cooperative_accounts for select to authenticated using ((select auth.uid()) = user_id and visible_to_member = true);
create policy "cooperative_admin_manage" on public.online_cooperative_accounts for all to authenticated using (is_monarch_admin() or is_sovereign_operator()) with check (is_monarch_admin() or is_sovereign_operator());
create policy "cooperative_members_read_own_allocations" on public.online_cooperative_allocations for select to authenticated using ((select auth.uid()) = user_id);
create policy "cooperative_admin_manage_allocations" on public.online_cooperative_allocations for all to authenticated using (is_monarch_admin() or is_sovereign_operator()) with check (is_monarch_admin() or is_sovereign_operator());
create policy "cooperative_admin_read_audit" on public.online_cooperative_audit_logs for select to authenticated using (is_monarch_admin() or is_sovereign_operator() or (select auth.uid()) = actor_user_id);
create policy "cooperative_admin_insert_audit" on public.online_cooperative_audit_logs for insert to authenticated with check (is_monarch_admin() or is_sovereign_operator());

create index if not exists online_cooperative_accounts_user_id_idx on public.online_cooperative_accounts(user_id);
create index if not exists online_cooperative_allocations_user_id_idx on public.online_cooperative_allocations(user_id);
create index if not exists online_cooperative_audit_target_idx on public.online_cooperative_audit_logs(target_user_id, created_at desc);

create function public.touch_online_cooperative_account() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger trg_touch_online_cooperative_account before update on public.online_cooperative_accounts for each row execute function public.touch_online_cooperative_account();
