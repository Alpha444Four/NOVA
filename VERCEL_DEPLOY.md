# Deploy NOVA Store on Vercel

NOVA runs on Vercel as a **zero-config Express** app. Static files live in `public/`; the API is served from `server/index.js` (exported via root `index.js`).

## Prerequisites

1. [Vercel account](https://vercel.com/signup) linked to GitHub
2. **Supabase Postgres** for persistent data (recommended for production). SQLite does not persist on Vercel serverless.
3. Environment variables configured in the Vercel project

## 1. Import the GitHub repo

1. Open [vercel.com/new](https://vercel.com/new)
2. Import **Alpha444Four/NOVA**
3. Framework preset: **Other** (Vercel auto-detects Express)
4. Build command: `npm run build` (runs `scripts/verify.js` — fails the deploy if API/static checks break)
5. Output directory: leave default (static files are in `public/`)

## 2. Environment variables

Set these in **Project → Settings → Environment Variables**:

| Variable | Required | Example |
|----------|----------|---------|
| `JWT_SECRET` | Yes | 48+ random characters |
| `NODE_ENV` | Yes | `production` |
| `ADMIN_EMAIL` | Yes | `admin@nova.com` |
| `ADMIN_PASSWORD` | Yes | strong password |
| `PUBLIC_URL` | Yes | `https://your-app.vercel.app` |
| `CORS_ORIGINS` | Yes | `https://your-app.vercel.app` |
| `USE_SUPABASE_DB` | Recommended | `true` |
| `DATABASE_URL` | Recommended | Supabase Postgres connection string |
| `SUPABASE_URL` | Optional | For Google/Apple OAuth |
| `SUPABASE_ANON_KEY` | Optional | For OAuth UI |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server OAuth exchange |

After adding `DATABASE_URL`, run the SQL in `supabase/migrations/` and `supabase/seed.sql` in the Supabase SQL Editor.

## 3. Deploy

Push to `main` — Vercel deploys automatically when the GitHub integration is connected.

Or deploy from CLI (after `vercel login`):

```bash
npm install
npx vercel --prod
```

## 4. Smoke tests

```bash
curl https://YOUR_APP.vercel.app/api/health
curl -I https://YOUR_APP.vercel.app/
```

In the browser:

1. Open the storefront — products should load
2. Sign up / log in
3. Log in as admin → `/admin.html`

## Notes

- **In-memory mode**: Without `DATABASE_URL`, the API uses seeded in-memory data (resets on cold starts). Use Supabase for production.
- **Custom domain**: Project → Settings → Domains → add `novadeluxe.dpdns.org` and update DNS per Vercel instructions.
- **OAuth redirects**: Add `https://YOUR_APP.vercel.app/auth/callback` to Supabase redirect URLs.
