# MONARCH CODEX — Hostinger/MySQL backend

This is the isolated Hostinger migration backend. The live Supabase system is intentionally untouched.

## Install
1. Create the MySQL database on the Hostinger VPS.
2. Import `schema.sql` into that database.
3. Copy `.env.example` to `.env` and fill the MySQL connection values and a strong JWT secret.
4. Run `npm install`.
5. Run `npm start`.
6. Put Nginx/Apache in front of port 3000 and proxy `/api` to it.

## Migration rule
Do not point the existing public pages at this API yet. The remaining work is to replace Supabase Auth, Storage, direct table/RPC calls, RLS authorization, and Edge Function calls page-by-page, then test each financial workflow before switching DNS.
