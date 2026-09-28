# MONARCH CODEX — Hostinger/MySQL migration

Migration branch: migration/hostinger-mysql

This branch builds the Hostinger backend without changing the live Supabase system.

Current:
- Node.js API foundation
- MySQL core authentication schema
- Existing Telegram/WhatsApp services remain external
- Existing production pages are not switched prematurely

Required migration phases:
1. Convert all remaining Supabase tables/functions/RLS to MySQL transactions and server-side authorization.
2. Move KYC/receipt/avatar storage to private Hostinger storage.
3. Convert every member/admin page from direct Supabase calls to the API.
4. Import existing Supabase data.
5. Verify login, KYC, wallet, investments, withdrawals, Academy, referrals, cooperative, admin and Telegram flows.
6. Switch DNS only after verification.

Do not delete the Supabase project until the new system passes verification.
