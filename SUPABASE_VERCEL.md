# Wire Supabase Postgres on Vercel (persistent users & orders)

On Vercel, the API runs in **serverless functions**. Without a database, data lives in **memory** and resets on cold starts. This guide connects **Supabase Postgres** so signups, logins, orders, and newsletter subscribers persist.

Live app: **https://nova-nine-rust.vercel.app** (Vercel project: `imad8/nova`)

---

## Fastest path — Vercel Marketplace (recommended)

1. Open **[vercel.com/imad8/nova](https://vercel.com/imad8/nova)** → **Storage** or **Integrations**.
2. Add **[Supabase](https://vercel.com/marketplace/supabase)** → create or link a project.
3. Vercel auto-injects `POSTGRES_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`, etc.
4. **Redeploy** production.

NOVA auto-detects `POSTGRES_URL`, runs the schema on first boot, and seeds admin + products. No manual SQL required.

Set these in Vercel if not already present:

| Variable | Value |
|----------|-------|
| `ADMIN_PASSWORD` | your admin password |
| `JWT_SECRET` | optional — uses `SUPABASE_JWT_SECRET` when linked |

Verify: `curl https://nova-nine-rust.vercel.app/api/health` → `"database": "postgres"`.

---

## Overview

```
Browser → Vercel (Express API) → Supabase Postgres
                ↑
         DATABASE_URL + USE_SUPABASE_DB=true
```

The server auto-seeds an admin user and products on first connect when tables are empty.

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Choose a region close to your Vercel deployment.
3. Save the **database password** (you need it for the connection string).

---

## Step 2 — Run the schema SQL

1. In Supabase, open **SQL Editor** → **New query**.
2. Paste the contents of [`supabase/migrations/20260328000000_nova_schema.sql`](./supabase/migrations/20260328000000_nova_schema.sql).
3. Click **Run**.

You should see tables: `users`, `products`, `orders`, `order_items`, `newsletter_subscribers`.

Optional: run [`supabase/seed.sql`](./supabase/seed.sql) for extra sample products (the API also seeds products if the table is empty).

---

## Step 3 — Get the Postgres connection string

1. Supabase → **Project Settings** → **Database**.
2. Under **Connection string**, choose **URI**.
3. Copy the string. It looks like:

   ```
   postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

4. Replace `[YOUR-PASSWORD]` with your actual database password.

**Tip:** Use the **Transaction pooler** (port `6543`) for Vercel serverless. Session mode (port `5432`) works for local dev.

---

## Step 4 — Set Vercel environment variables

Vercel → your NOVA project → **Settings** → **Environment Variables**.

Add these for **Production** (and Preview if you want):

| Variable | Value | Required |
|----------|-------|----------|
| `USE_SUPABASE_DB` | `true` | Yes |
| `DATABASE_URL` | Postgres URI from Step 3 | Yes |
| `JWT_SECRET` | 48+ random characters | Yes |
| `NODE_ENV` | `production` | Yes |
| `ADMIN_EMAIL` | e.g. `admin@nova.com` | Yes |
| `ADMIN_PASSWORD` | strong password | Yes |
| `PUBLIC_URL` | `https://nova-nine-rust.vercel.app` | Yes |
| `CORS_ORIGINS` | same URL as `PUBLIC_URL` | Yes |

Optional (OAuth — not required for email/password auth):

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only OAuth exchange |

Click **Save**, then **Redeploy** the latest deployment (Deployments → ⋮ → Redeploy).

---

## Step 5 — Verify persistence

### Health check

```bash
curl https://nova-nine-rust.vercel.app/api/health
```

Expected:

```json
{
  "ok": true,
  "service": "nova-store",
  "database": "postgres",
  ...
}
```

If `"database": "memory"`, check:

- `USE_SUPABASE_DB` is exactly `true`
- `DATABASE_URL` has no placeholder text like `[YOUR-PASSWORD]`
- You redeployed **after** saving env vars

### Sign up and place an order

1. Open the storefront → **Sign up** with a new email.
2. Add items to cart → checkout.
3. Open **Account** — order should appear.
4. Log in to **Admin** (`/admin.html`) with `ADMIN_EMAIL` / `ADMIN_PASSWORD` — stats and orders should update.

### Supabase dashboard

Supabase → **Table Editor** → check `users`, `orders`, `order_items`.

---

## Local development with Supabase

Create `.env` in the project root (never commit this file):

```env
USE_SUPABASE_DB=true
DATABASE_URL=postgresql://postgres.[ref]:password@aws-0-....pooler.supabase.com:6543/postgres
JWT_SECRET=local-dev-secret-at-least-32-characters-long
ADMIN_EMAIL=admin@nova.com
ADMIN_PASSWORD=NovaAdmin2026!
PUBLIC_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

```bash
npm install
npm start
```

Visit http://localhost:3000 — `/api/health` should report `"database": "postgres"`.

---

## How seeding works

On first API startup with Postgres:

1. If no user matches `ADMIN_EMAIL`, an admin row is inserted.
2. If `products` is empty, the built-in catalog is inserted.

Change admin credentials via Vercel env vars **before** first production deploy, or update the row in Supabase.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `database: memory` on Vercel | Set `USE_SUPABASE_DB=true` and valid `DATABASE_URL`; redeploy |
| `password authentication failed` | Reset DB password in Supabase; update `DATABASE_URL` |
| `relation "users" does not exist` | Run migration SQL in Supabase SQL Editor |
| Login returns 401 after deploy | Set `JWT_SECRET` (must stay the same across redeploys) |
| Cookies not set | Set `PUBLIC_URL` to your HTTPS Vercel URL |
| Admin 403 | Use `ADMIN_EMAIL` / `ADMIN_PASSWORD` from Vercel env |
| SSL errors locally | Pooler URL + `ssl: { rejectUnauthorized: false }` is already configured in `server/db.js` |

---

## Security checklist

- [ ] `JWT_SECRET` is long and unique per environment
- [ ] `ADMIN_PASSWORD` is strong and not the default in production
- [ ] `DATABASE_URL` is only in Vercel env vars, never in git
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-only (never in client code)
- [ ] Supabase **Row Level Security** is optional for this app (API uses direct Postgres via `pg`)

---

## Related docs

- [PUSH_TO_GITHUB.md](./PUSH_TO_GITHUB.md) — sync your full local folder to GitHub
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) — general Vercel deployment
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — OAuth (Google/Apple) via Supabase Auth
