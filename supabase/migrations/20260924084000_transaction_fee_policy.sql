-- MONARCH CODEX transaction fee policy
-- Investment: fixed $1
-- Academy subscription: 2%
-- Signal subscription: 2% (configured for the future subscription flow)
-- Withdrawal: 2%
-- Other paid transaction: 2%
--
-- Additive only. No existing financial tables are dropped or reset.

create table if not exists public.transaction_fee_settings (
  transaction_type text primary key,
  fee_type text not null check (fee_type in ('fixed','percentage')),
  fee_value numeric(12,4) not null check (fee_value >= 0),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.transaction_fee_settings enable row level security;
revoke all on table public.transaction_fee_settings from anon, authenticated;
grant select on table public.transaction_fee_settings to authenticated;

drop policy if exists "transaction_fee_settings_authenticated_read" on public.transaction_fee_settings;
create policy "transaction_fee_settings_authenticated_read"
on public.transaction_fee_settings
for select to authenticated
using (true);

insert into public.transaction_fee_settings(transaction_type,fee_type,fee_value)
values
 ('investment','fixed',1),
 ('academy_subscription','percentage',2),
 ('signal_subscription','percentage',2),
 ('withdrawal','percentage',2),
 ('other_paid_transaction','percentage',2)
on conflict (transaction_type) do update
set fee_type=excluded.fee_type,
    fee_value=excluded.fee_value,
    active=true,
    updated_at=now();

create or replace function public.purchase_investment_from_wallet(p_package_id integer)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 uid uuid:=auth.uid();
 p public.packages%rowtype;
 prof public.profiles%rowtype;
 cfg public.transaction_fee_settings%rowtype;
 fee_amount numeric;
 total_amount numeric;
 before_balance numeric;
 after_balance numeric;
 inv public.investments%rowtype;
begin
 if uid is null then raise exception 'Authentication required.'; end if;
 select * into prof from public.profiles where id=uid for update;
 if not found then raise exception 'Profile not found.'; end if;
 if lower(coalesce(prof.kyc_status,''))<>'approved' then
   raise exception 'KYC approval is required before purchasing an investment package.';
 end if;
 select * into p from public.packages where id=p_package_id and active=true;
 if not found then raise exception 'Investment package is unavailable.'; end if;
 select * into cfg from public.transaction_fee_settings
 where transaction_type='investment' and active=true;
 fee_amount:=case
   when cfg.fee_type='percentage' then round(coalesce(p.amount,0)*cfg.fee_value/100,2)
   else round(coalesce(cfg.fee_value,1),2)
 end;
 total_amount:=round(coalesce(p.amount,0)+fee_amount,2);
 if total_amount<=0 then raise exception 'Invalid package amount.'; end if;
 before_balance:=coalesce(prof.balance,0);
 if before_balance<total_amount then
   raise exception 'Insufficient wallet balance. You need $% including the $% investment fee.',
     to_char(total_amount,'FM999999990.00'),to_char(fee_amount,'FM999999990.00');
 end if;
 after_balance:=before_balance-total_amount;
 update public.profiles set balance=after_balance,updated_at=now() where id=uid;
 insert into public.investments(user_id,package_name,amount,payment_method,method,status,fee,note)
 values(uid,p.name,p.amount,'wallet','wallet','pending',fee_amount,
        'Investment purchase submitted from funded wallet.')
 returning * into inv;
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

create or replace function public.request_academy_subscription()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 uid uuid:=auth.uid();
 prof public.profiles%rowtype;
 settings public.academy_settings%rowtype;
 existing public.academy_subscriptions%rowtype;
 cfg public.transaction_fee_settings%rowtype;
 before_balance numeric;
 after_balance numeric;
 subscription_amount numeric;
 fee_amount numeric;
 total_amount numeric;
 sub_id uuid;
begin
 if uid is null then raise exception 'Authentication required.'; end if;
 select * into prof from public.profiles where id=uid for update;
 if not found then raise exception 'Profile not found.'; end if;
 select * into settings from public.academy_settings where id=true;
 if not found or not settings.active then
   raise exception 'Academy subscriptions are currently unavailable.';
 end if;
 subscription_amount:=round(coalesce(settings.academy_price,0),2);
 if subscription_amount<=0 then raise exception 'Academy price is not configured.'; end if;
 select * into cfg from public.transaction_fee_settings
 where transaction_type='academy_subscription' and active=true;
 fee_amount:=case
   when cfg.fee_type='percentage' then round(subscription_amount*cfg.fee_value/100,2)
   else round(cfg.fee_value,2)
 end;
 total_amount:=round(subscription_amount+fee_amount,2);
 select * into existing from public.academy_subscriptions
 where user_id=uid and status in ('pending','approved') limit 1;
 if found then raise exception 'You already have an active Academy subscription request.'; end if;
 before_balance:=coalesce(prof.balance,0);
 if before_balance<total_amount then
   raise exception 'Insufficient wallet balance. You need $% including the Academy fee.',
     to_char(total_amount,'FM999999990.00');
 end if;
 after_balance:=before_balance-total_amount;
 update public.profiles set balance=after_balance,updated_at=now() where id=uid;
 insert into public.academy_subscriptions(user_id,amount,fee,status)
 values(uid,subscription_amount,fee_amount,'pending') returning id into sub_id;
 insert into public.wallet_transactions(
   user_id,direction,amount,fee,balance_before,balance_after,
   source_type,reference_id,description,created_by
 ) values(
   uid,'debit',subscription_amount,fee_amount,before_balance,after_balance,
   'academy_subscription',sub_id::text,
   'Academy subscription request pending admin review.',uid
 );
 return jsonb_build_object(
   'ok',true,'subscription_id',sub_id,'amount',subscription_amount,
   'fee',fee_amount,'total',total_amount,'balance',after_balance,'status','pending'
 );
end;
$$;

create or replace function public.validate_monarch_withdrawal()
returns trigger language plpgsql security definer set search_path='public'
as $$
declare
 available_earnings numeric(12,2);
 eligible_capital numeric(12,2);
 total_capital numeric(12,2);
 capital_reduced numeric(12,2);
 eligible_original numeric(12,2);
 withdrawn_earnings numeric(12,2);
 withdrawn_capital numeric(12,2);
 cfg public.transaction_fee_settings%rowtype;
begin
 if new.amount is null or new.amount<=0 then
   raise exception 'Withdrawal amount must be greater than zero.';
 end if;
 select * into cfg from public.transaction_fee_settings
 where transaction_type='withdrawal' and active=true;
 new.fee:=case
   when cfg.fee_type='percentage' then round(new.amount*cfg.fee_value/100,2)
   else round(cfg.fee_value,2)
 end;

 select coalesce(sum(e.amount),0) into available_earnings
 from public.earnings e where e.user_id=new.user_id;
 select coalesce(sum(w.amount+coalesce(w.fee,0)),0) into withdrawn_earnings
 from public.withdrawals w
 where w.user_id=new.user_id
   and lower(coalesce(w.status,'pending')) not in ('rejected','cancelled','failed')
   and lower(coalesce(w.source_type,'earnings'))='earnings';
 available_earnings:=greatest(0,available_earnings-withdrawn_earnings);

 select coalesce(sum(i.amount),0) into total_capital
 from public.investments i
 where i.user_id=new.user_id
   and lower(coalesce(i.status,'')) in ('approved','active','confirmed','completed');
 select coalesce(sum(c.amount),0) into capital_reduced
 from public.capital_adjustments c where c.user_id=new.user_id;
 select coalesce(sum(i.amount),0) into eligible_original
 from public.investments i
 where i.user_id=new.user_id
   and lower(coalesce(i.status,'')) in ('approved','active','confirmed','completed')
   and coalesce(i.approved_at,i.created_at)<=now()-interval '3 months';
 eligible_capital:=greatest(0,least(total_capital,eligible_original)-capital_reduced);

 select coalesce(sum(w.amount+coalesce(w.fee,0)),0) into withdrawn_capital
 from public.withdrawals w
 where w.user_id=new.user_id
   and lower(coalesce(w.status,'pending')) not in ('rejected','cancelled','failed')
   and lower(coalesce(w.source_type,'earnings'))='capital';
 eligible_capital:=greatest(0,eligible_capital-withdrawn_capital);

 if new.source_type='earnings' then
   if available_earnings<10 then
     raise exception 'You need at least $10 in available earnings before you can withdraw earnings.';
   end if;
   if new.amount>available_earnings then
     raise exception 'Withdrawal exceeds your available earnings of $.',
       to_char(available_earnings,'FM999999990.00');
   end if;
 elsif new.source_type='capital' then
   if eligible_capital<=0 then
     raise exception 'No investment capital is eligible yet. Capital becomes withdrawable 3 months after approval.';
   end if;
   if new.amount>eligible_capital then
     raise exception 'Withdrawal exceeds your eligible investment capital of $.',
       to_char(eligible_capital,'FM999999990.00');
   end if;
 else
   raise exception 'Invalid withdrawal source. Choose earnings or capital.';
 end if;
 return new;
end;
$$;
