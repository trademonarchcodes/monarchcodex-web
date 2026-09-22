create or replace function public.allocate_online_cooperative_on_investment_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null
     and new.status = 'approved'
     and (tg_op = 'INSERT' or coalesce(old.status,'') <> 'approved') then
    insert into public.online_cooperative_allocations(user_id, investment_id, allocated_amount)
    values (new.user_id, new.id, 10)
    on conflict (investment_id) do nothing;

    insert into public.online_cooperative_accounts(user_id, initial_contribution, status)
    values (new.user_id, 10, 'pending_setup')
    on conflict (user_id) do update
      set initial_contribution = greatest(public.online_cooperative_accounts.initial_contribution, excluded.initial_contribution),
          updated_at = now();
  end if;
  return new;
end;
$$;
revoke all on function public.allocate_online_cooperative_on_investment_approval() from public, anon, authenticated;
create trigger trg_allocate_online_cooperative after insert or update of status on public.investments for each row execute function public.allocate_online_cooperative_on_investment_approval();
