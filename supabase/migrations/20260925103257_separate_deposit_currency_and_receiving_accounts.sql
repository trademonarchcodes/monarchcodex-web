alter table public.payment_details
  add column if not exists accepted_currency text,
  add column if not exists payment_instructions text;

alter table public.wallet_funding_requests
  add column if not exists payment_currency text,
  add column if not exists payment_amount numeric,
  add column if not exists payment_fee numeric,
  add column if not exists payment_total numeric,
  add column if not exists payment_detail_id integer,
  add column if not exists receiving_account_snapshot jsonb;

create index if not exists idx_payment_details_active_currency
  on public.payment_details(active, accepted_currency);

create index if not exists idx_wallet_funding_payment_detail
  on public.wallet_funding_requests(payment_detail_id);
