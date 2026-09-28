# MONARCH CODEX — Hostinger VPS deployment

The migration branch is isolated from `main`. Do not switch DNS yet.

## On the Hostinger VPS

Copy the `hostinger/` directory to the server, then:

1. Edit `server/.env`.
2. Set a strong unique `JWT_SECRET`.
3. Set `MYSQL_PASSWORD` to the same value used by MySQL.
4. Set `UPLOAD_ROOT=/app/private-uploads`.
5. Run:

```
docker compose -f docker-compose.yml up -d --build
```

6. Check:

```
curl http://127.0.0.1:3000/api/health
```

Expected response contains `"ok":true` and `"database":"ok"`.

## Web server

Point the Hostinger domain's web root at the repository's website files and proxy `/api/` to `127.0.0.1:3000`.

## Important

The existing Supabase project remains the production fallback. Do not delete it until the Hostinger copy has passed registration, login, KYC, wallet funding, investment purchase/review, withdrawals, Academy, referrals, cooperative, admin and Telegram tests.

The database schema file creates the MySQL application structure. Existing production data still needs a controlled export/import into MySQL before cutover.
