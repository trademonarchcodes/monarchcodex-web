# MONARCH CODEX - Hostinger/MySQL migration

This branch is the isolated Hostinger migration. The live main branch and current Supabase project are not changed.

Target architecture:

Hostinger VPS -> Node.js API -> MySQL -> private file storage

Required Hostinger setup:

1. Create the empty MySQL database.
2. Install Node.js on the VPS.
3. Copy .env.example to .env and set the MySQL credentials and a long JWT secret.
4. Install dependencies with npm install.
5. Run the one-time PostgreSQL-to-MySQL data migration using the supplied migration tooling.
6. Verify row counts and files before switching the live site.

The current MONARCH CODEX frontend still contains direct Supabase Auth, database RPC and Storage calls. Those calls must be converted to the Hostinger API page-by-page before the DNS/site cutover. This branch intentionally does not replace the working production frontend blindly.

Never put MySQL credentials in browser code. Do not delete the Supabase project until the Hostinger build has been fully tested.
