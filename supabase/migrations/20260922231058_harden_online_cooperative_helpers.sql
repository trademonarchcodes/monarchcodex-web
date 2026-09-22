create or replace function public.touch_online_cooperative_account()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.touch_online_cooperative_account() from public, anon, authenticated;
