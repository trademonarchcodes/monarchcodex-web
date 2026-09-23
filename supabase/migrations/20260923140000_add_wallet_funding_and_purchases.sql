-- Wallet funding and one-click wallet purchases
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  direction text not null check (direction in ('credit','debit')),
  amount numeric not null check (amount > 0),
  fee numeric not null default 0 check (fee >= 0),
  balance_before numeric not null,
  balance_after numeric not null,
  source_type text not null,
  reference_id text,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists wallet_transactions_user_created_idx on public.wallet_transactions(user_id, created_at desc);

create table if not exists public.wallet_funding_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null check (amount > 0),
  fee numeric not null default 2 check (fee >= 0),
  total numeric not null check (total > 0),
  payment_method text not null check (payment_method in ('bank','wallet','spenda')),
  receipt_url text,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists wallet_funding_requests_user_created_idx on public.wallet_funding_requests(user_id, created_at desc);

alter table public.wallet_transactions enable row level security;
alter table public.wallet_funding_requests enable row level security;

drop policy if exists "wallet transactions own select" on public.wallet_transactions;
create policy "wallet transactions own select" on public.wallet_transactions for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "wallet funding own select" on public.wallet_funding_requests;
create policy "wallet funding own select" on public.wallet_funding_requests for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "wallet funding own insert" on public.wallet_funding_requests;
create policy "wallet funding own insert" on public.wallet_funding_requests for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "wallet funding admin select" on public.wallet_funding_requests;
create policy "wallet funding admin select" on public.wallet_funding_requests for select to authenticated using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and (lower(coalesce(p.role,'')) like '%admin%' or lower(coalesce(p.role,''))='sovereign_desk')));
drop policy if exists "wallet funding admin update" on public.wallet_funding_requests;
create policy "wallet funding admin update" on public.wallet_funding_requests for update to authenticated using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and (lower(coalesce(p.role,'')) like '%admin%' or lower(coalesce(p.role,''))='sovereign_desk'))) with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and (lower(coalesce(p.role,'')) like '%admin%' or lower(coalesce(p.role,''))='sovereign_desk')));

create or replace function public.purchase_investment_from_wallet(p_package_id integer)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid:=auth.uid(); p public.packages%rowtype; prof public.profiles%rowtype; fee_amount numeric:=1; total_amount numeric; before_balance numeric; after_balance numeric; inv public.investments%rowtype;
begin
 if uid is null then raise exception 'Authentication required.'; end if;
 select * into prof from public.profiles where id=uid for update;
 if not found then raise exception 'Profile not found.'; end if;
 if lower(coalesce(prof.kyc_status,''))<>'approved' then raise exception 'KYC approval is required before purchasing an investment package.'; end if;
 select * into p from public.packages where id=p_package_id and active=true;
 if not found then raise exception 'Investment package is unavailable.'; end if;
 total_amount:=coalesce(p.amount,0)+fee_amount;
 if total_amount<=0 then raise exception 'Invalid package amount.'; end if;
 before_balance:=coalesce(prof.balance,0);
 if before_balance<total_amount then raise exception 'Insufficient wallet balance. You need $% including the $1 wallet transfer charge.',to_char(total_amount,'FM999999990.00'); end if;
 after_balance:=before_balance-total_amount;
 update public.profiles set balance=after_balance,total_invested=coalesce(total_invested,0)+coalesce(p.amount,0),updated_at=now() where id=uid;
 insert into public.investments(user_id,package_name,amount,payment_method,method,status,approved_at,fee,note) values(uid,p.name,p.amount,'wallet','wallet','approved',now(),fee_amount,'Purchased from funded wallet.') returning * into inv;
 insert into public.wallet_transactions(user_id,direction,amount,fee,balance_before,balance_after,source_type,reference_id,description,created_by) values(uid,'debit',coalesce(p.amount,0),fee_amount,before_balance,after_balance,'investment',inv.id::text,'Investment package purchase from wallet.',uid);
 return jsonb_build_object('ok',true,'investment_id',inv.id,'package_name',p.name,'amount',p.amount,'fee',fee_amount,'total',total_amount,'balance',after_balance);
end;
$$;
revoke execute on function public.purchase_investment_from_wallet(integer) from public,anon;
grant execute on function public.purchase_investment_from_wallet(integer) to authenticated;

create or replace function public.approve_wallet_funding(p_request_id uuid,p_admin_note text default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare admin_uid uuid:=auth.uid(); req public.wallet_funding_requests%rowtype; prof public.profiles%rowtype; before_balance numeric; after_balance numeric;
begin
 if admin_uid is null then raise exception 'Authentication required.'; end if;
 if not exists(select 1 from public.profiles where id=admin_uid and (lower(coalesce(role,'')) like '%admin%' or lower(coalesce(role,''))='sovereign_desk')) then raise exception 'Admin authorization required.'; end if;
 select * into req from public.wallet_funding_requests where id=p_request_id for update;
 if not found then raise exception 'Funding request not found.'; end if;
 if req.status<>'pending' then raise exception 'Funding request has already been reviewed.'; end if;
 select * into prof from public.profiles where id=req.user_id for update;
 before_balance:=coalesce(prof.balance,0); after_balance:=before_balance+req.amount;
 update public.profiles set balance=after_balance,updated_at=now() where id=req.user_id;
 update public.wallet_funding_requests set status='approved',admin_note=p_admin_note,reviewed_by=admin_uid,reviewed_at=now() where id=req.id;
 insert into public.wallet_transactions(user_id,direction,amount,fee,balance_before,balance_after,source_type,reference_id,description,created_by) values(req.user_id,'credit',req.amount,req.fee,before_balance,after_balance,'wallet_funding',req.id::text,'Wallet funding approved.',admin_uid);
 return jsonb_build_object('ok',true,'request_id',req.id,'balance',after_balance);
end;
$$;
revoke execute on function public.approve_wallet_funding(uuid,text) from public,anon;
grant execute on function public.approve_wallet_funding(uuid,text) to authenticated;

create or replace function public.reject_wallet_funding(p_request_id uuid,p_admin_note text default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare admin_uid uuid:=auth.uid(); req public.wallet_funding_requests%rowtype;
begin
 if admin_uid is null then raise exception 'Authentication required.'; end if;
 if not exists(select 1 from public.profiles where id=admin_uid and (lower(coalesce(role,'')) like '%admin%' or lower(coalesce(role,''))='sovereign_desk')) then raise exception 'Admin authorization required.'; end if;
 select * into req from public.wallet_funding_requests where id=p_request_id for update;
 if not found then raise exception 'Funding request not found.'; end if;
 if req.status<>'pending' then raise exception 'Funding request has already been reviewed.'; end if;
 update public.wallet_funding_requests set status='rejected',admin_note=p_admin_note,reviewed_by=admin_uid,reviewed_at=now() where id=req.id;
 return jsonb_build_object('ok',true,'request_id',req.id);
end;
$$;
revoke execute on function public.reject_wallet_funding(uuid,text) from public,anon;
grant execute on function public.reject_wallet_funding(uuid,text) to authenticated;