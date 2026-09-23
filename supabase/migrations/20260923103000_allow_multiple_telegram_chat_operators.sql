-- A Telegram group/channel may be managed by more than one SOVEREIGN DESK operator.
-- Keep the existing assignment rows; only remove the single-chat uniqueness constraint.
alter table public.telegram_chat_assignments
  drop constraint if exists telegram_chat_assignments_telegram_chat_id_key;

create index if not exists telegram_chat_assignments_chat_active_idx
  on public.telegram_chat_assignments (telegram_chat_id, active);

create index if not exists telegram_chat_assignments_operator_active_idx
  on public.telegram_chat_assignments (operator_user_id, active);
