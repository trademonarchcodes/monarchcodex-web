-- Investment wallet review workflow
-- Purchases reserve the full package amount plus the $1 wallet charge.
-- The request stays pending until admin approval. Rejection returns the full reserved amount.
create or replace function public.purchase_investment_from_wallet(p_package_id integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  p public.packages%rowtype;
  prof public.profiles%rowtype;
  fee_amount numeric := 1;
  total_amount numeric;
  before_balance numeric;
  after_balance numeric;
  inv public.investments%rowtype;
begin
  if uid is null then raise exception 'Authentication required.'; end if;
  select * into prof from public.profiles where id=uid for update;
  if not found then raise exception 'Profile not found.'; end if;
  if lower(coalesce(prof.kyc_status,'')) <> 'approved' then
    raise exception 'KYC approval is required before purchasing an investment package.';
  end if;
  select * into p from public.packages where id=p_package_id and active=true;
  if not found then raise exception 'Investment package is unavailable.'; end if;
  total_amount := coalesce(p.amount,0) + fee_amount;
  if total_amount <= 0 then raise exception 'Invalid package amount.'; end if;
  before_balance := coalesce(prof.balance,0);
  if before_balance < total_amount then
    raise exception 'Insufficient wallet balance. You need $% including the $1 wallet transfer charge.',
      to_char(total_amount,'FM999999990.00');
  end if;
  after_balance := before_balance - total_amount;
  update public.profiles set balance=after_balance, updated_at=now() where id=uid;
  insert into public.investments(
    user_id,package_name,amount,payment_method,method,status,fee,note
  ) values(
    uid,p.name,p.amount,'wallet','wallet','pending',fee_amount,
    'Investment purchase submitted from funded wallet.'
  ) returning * into inv;
  insert into public.wallet_transactions(
    user_id,direction,amount,fee,balance_before,balance_after,
    source_type,reference_id,description,created_by
  ) values(
    uid,'debit',coalesce(p.amount,0),fee_amount,before_balance,after_balance,
    'investment',inv.id::text,'Investment purchase pending admin review.',uid
  );
  return jsonb_build_object(
    'ok',true,'investment_id',inv.id,'package_name',p.name,
    'amount',p.amount,'fee',fee_amount,'total',total_amount,
    'balance',after_balance,'status','pending'
  );
end;
$$;

create or replace function public.approve_investment_request(
  p_investment_id uuid,p_admin_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_uid uuid := auth.uid();
  inv public.investments%rowtype;
  prof public.profiles%rowtype;
begin
  if admin_uid is null then raise exception 'Authentication required.'; end if;
  if not exists(
    select 1 from public.profiles
    where id=admin_uid
      and (lower(coalesce(role,'')) like '%admin%' or lower(coalesce(role,''))='sovereign_desk')
  ) then raise exception 'Admin authorization required.'; end if;
  select * into inv from public.investments where id=p_investment_id for update;
  if not found then raise exception 'Investment request not found.'; end if;
  if lower(coalesce(inv.status,'')) <> 'pending' then
    raise exception 'Investment request has already been reviewed.';
  end if;
  update public.investments
  set status='approved',approved_at=now(),
      note=case when nullif(trim(coalesce(p_admin_reason,'')),'') is null
        then note else trim(p_admin_reason) end
  where id=inv.id;
  select * into prof from public.profiles where id=inv.user_id for update;
  update public.profiles
  set total_invested=coalesce(total_invested,0)+coalesce(inv.amount,0),
      updated_at=now()
  where id=prof.id;
  return jsonb_build_object(
    'ok',true,'investment_id',inv.id,'status','approved',
    'amount',inv.amount,'fee',coalesce(inv.fee,0)
  );
end;
$$;

create or replace function public.reject_investment_request(
  p_investment_id uuid,p_admin_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_uid uuid := auth.uid();
  inv public.investments%rowtype;
  prof public.profiles%rowtype;
  before_balance numeric;
  after_balance numeric;
  refund_amount numeric;
begin
  if admin_uid is null then raise exception 'Authentication required.'; end if;
  if not exists(
    select 1 from public.profiles
    where id=admin_uid
      and (lower(coalesce(role,'')) like '%admin%' or lower(coalesce(role,''))='sovereign_desk')
  ) then raise exception 'Admin authorization required.'; end if;
  if nullif(trim(coalesce(p_admin_reason,'')),'') is null then
    raise exception 'A rejection reason is required.';
  end if;
  select * into inv from public.investments where id=p_investment_id for update;
  if not found then raise exception 'Investment request not found.'; end if;
  if lower(coalesce(inv.status,'')) <> 'pending' then
    raise exception 'Investment request has already been reviewed.';
  end if;
  select * into prof from public.profiles where id=inv.user_id for update;
  before_balance := coalesce(prof.balance,0);
  refund_amount := coalesce(inv.amount,0)+coalesce(inv.fee,0);
  after_balance := before_balance+refund_amount;
  update public.profiles set balance=after_balance,updated_at=now() where id=prof.id;
  update public.investments set status='rejected',note=trim(p_admin_reason) where id=inv.id;
  insert into public.wallet_transactions(
    user_id,direction,amount,fee,balance_before,balance_after,
    source_type,reference_id,description,created_by
  ) values(
    inv.user_id,'credit',refund_amount,0,before_balance,after_balance,
    'investment_refund',inv.id::text,
    'Investment purchase rejected; full package amount and fee returned.',admin_uid
  );
  return jsonb_build_object(
    'ok',true,'investment_id',inv.id,'status','rejected',
    'refund',refund_amount,'balance',after_balance
  );
end;
$$;

revoke execute on function public.purchase_investment_from_wallet(integer) from public,anon;
revoke execute on function public.approve_investment_request(uuid,text) from public,anon;
revoke execute on function public.reject_investment_request(uuid,text) from public,anon;
grant execute on function public.purchase_investment_from_wallet(integer) to authenticated;
grant execute on function public.approve_investment_request(uuid,text) to authenticated;
grant execute on function public.reject_investment_request(uuid,text) to authenticated;
