# MONARCH CODEX — Hostinger/MySQL migration status

## Already converted on this branch
- MySQL application schema generated from the current public Supabase schema
- Hostinger Node.js API foundation
- Hostinger JWT/password authentication
- Browser compatibility client replacing the Supabase browser SDK
- Generic authenticated table API with member/admin access controls
- Academy start/complete operations
- Academy subscription request/approve/reject operations
- Investment purchase/approve/reject operations
- Wallet funding approve/reject operations
- Sovereign Desk profit operation
- Protected permanent member deletion
- Hostinger local file upload/public/signed-file infrastructure
- Homepage public site-content endpoint

## Not yet production-ready
- Full conversion of every Supabase RPC/business function
- Full notification dispatcher migration
- Complete Telegram backend migration
- Complete WhatsApp/Resend integration migration
- Password-reset email delivery
- Full historical Supabase data import
- Production testing of every member/admin/financial workflow

## Important
Do NOT point the live domain to this branch yet. The current Supabase system remains the fallback while the remaining handlers and migration import are completed.
