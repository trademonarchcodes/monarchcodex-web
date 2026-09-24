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


-- Academy progression hardening
alter policy "academy_progress_insert" on public.academy_progress
  with check ((auth.uid() = user_id) and status = 'started');

alter policy "academy_progress_update" on public.academy_progress
  using ((auth.uid() = user_id) and status = 'started')
  with check ((auth.uid() = user_id) and status = 'started');

create or replace function public.start_academy_course(p_course_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid:=auth.uid(); c public.academy_courses%rowtype; l public.academy_lessons%rowtype;
begin
 if uid is null then raise exception 'Authentication required.'; end if;
 if not exists(select 1 from public.academy_subscriptions where user_id=uid and status='approved') then raise exception 'An approved Academy subscription is required.'; end if;
 select c0.* into c from public.academy_courses c0 where c0.id=p_course_id and c0.status='published';
 if not found then raise exception 'Course is unavailable.'; end if;
 select l0.* into l from public.academy_lessons l0 where l0.id=c.lesson_id and l0.status='published';
 if not found then raise exception 'Course lesson is unavailable.'; end if;
 if exists(
   select 1 from public.academy_courses earlier
   join public.academy_lessons el on el.id=earlier.lesson_id
   where earlier.status='published' and el.status='published'
     and (el.position<l.position or (el.position=l.position and earlier.position<c.position))
     and not exists(select 1 from public.academy_progress pr where pr.user_id=uid and pr.course_id=earlier.id and pr.status='completed')
 ) then raise exception 'Complete the current course before opening this course.'; end if;
 insert into public.academy_progress(user_id,course_id,status,started_at,updated_at)
 values(uid,c.id,'started',now(),now())
 on conflict (user_id,course_id) do update
 set status=case when public.academy_progress.status='completed' then public.academy_progress.status else 'started' end,
     started_at=coalesce(public.academy_progress.started_at,excluded.started_at),updated_at=now();
 return jsonb_build_object('ok',true,'course_id',c.id,'status','started');
end;
$$;

create or replace function public.complete_academy_course(p_course_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare uid uuid:=auth.uid(); c public.academy_courses%rowtype; l public.academy_lessons%rowtype;
begin
 if uid is null then raise exception 'Authentication required.'; end if;
 if not exists(select 1 from public.academy_subscriptions where user_id=uid and status='approved') then raise exception 'An approved Academy subscription is required.'; end if;
 select c0.* into c from public.academy_courses c0 where c0.id=p_course_id and c0.status='published';
 if not found then raise exception 'Course is unavailable.'; end if;
 select l0.* into l from public.academy_lessons l0 where l0.id=c.lesson_id and l0.status='published';
 if not found then raise exception 'Course lesson is unavailable.'; end if;
 if exists(
   select 1 from public.academy_courses earlier
   join public.academy_lessons el on el.id=earlier.lesson_id
   where earlier.status='published' and el.status='published'
     and (el.position<l.position or (el.position=l.position and earlier.position<c.position))
     and not exists(select 1 from public.academy_progress pr where pr.user_id=uid and pr.course_id=earlier.id and pr.status='completed')
 ) then raise exception 'Complete the current course before completing this course.'; end if;
 insert into public.academy_progress(user_id,course_id,status,started_at,completed_at,updated_at)
 values(uid,c.id,'completed',now(),now(),now())
 on conflict (user_id,course_id) do update
 set status='completed',completed_at=now(),started_at=coalesce(public.academy_progress.started_at,excluded.started_at),updated_at=now();
 return jsonb_build_object('ok',true,'course_id',c.id,'status','completed');
end;
$$;

revoke execute on function public.start_academy_course(uuid) from public,anon;
revoke execute on function public.complete_academy_course(uuid) from public,anon;
grant execute on function public.start_academy_course(uuid) to authenticated;
grant execute on function public.complete_academy_course(uuid) to authenticated;

-- Ensure Academy security-definer RPCs are never anonymously executable.
revoke execute on function public.request_academy_subscription() from public,anon;
revoke execute on function public.approve_academy_subscription(uuid,text) from public,anon;
revoke execute on function public.reject_academy_subscription(uuid,text) from public,anon;
grant execute on function public.request_academy_subscription() to authenticated;
grant execute on function public.approve_academy_subscription(uuid,text) to authenticated;
grant execute on function public.reject_academy_subscription(uuid,text) to authenticated;
