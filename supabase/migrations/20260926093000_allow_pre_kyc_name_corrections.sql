-- Allow members to correct their full name before KYC starts.
-- Once any KYC identity document/data is present, the database locks full_name.

create or replace function public.update_my_profile(
  p_display_username text default null,
  p_phone text default null,
  p_avatar_url text default null,
  p_withdrawal_account_name text default null,
  p_withdrawal_account_number text default null,
  p_withdrawal_bank text default null,
  p_full_name text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_profile public.profiles;
  v_has_started_kyc boolean;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        nullif(trim(coalesce(nin_number,'')), '') is not null
        or nullif(trim(coalesce(nin_front_url,'')), '') is not null
        or nullif(trim(coalesce(nin_back_url,'')), '') is not null
        or nullif(trim(coalesce(selfie_url,'')), '') is not null
      )
  ) into v_has_started_kyc;

  v_name := trim(coalesce(p_full_name,''));

  if p_full_name is not null then
    if v_has_started_kyc then
      raise exception 'Your full name is locked after KYC has been started.';
    end if;
    if length(v_name) < 3 or v_name !~ '[A-Za-z]' or v_name ~ '^[0-9[:space:]+()\-]+$' then
      raise exception 'Enter your real full name using letters.';
    end if;
  end if;

  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Profile not found';
  end if;

  update public.profiles
  set
    full_name = case when p_full_name is null then full_name else v_name end,
    display_username = case when p_display_username is null then display_username else trim(p_display_username) end,
    phone = case when p_phone is null then phone else trim(p_phone) end,
    avatar_url = case when p_avatar_url is null then avatar_url else trim(p_avatar_url) end,
    withdrawal_account_name = case when p_withdrawal_account_name is null then withdrawal_account_name else trim(p_withdrawal_account_name) end,
    withdrawal_account_number = case when p_withdrawal_account_number is null then withdrawal_account_number else trim(p_withdrawal_account_number) end,
    withdrawal_bank = case when p_withdrawal_bank is null then withdrawal_bank else trim(p_withdrawal_bank) end,
    updated_at = now()
  where id = auth.uid()
  returning * into v_profile;

  return v_profile;
end;
$function$;