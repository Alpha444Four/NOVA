# Connect NOVA to GitHub + Supabase

This guide links your repo to **GitHub**, your app to **Supabase** (Auth + Postgres database), and optional **GitHub ↔ Supabase** integration for migrations.

---

## Part 1 — GitHub repository

### 1. Install Git (if needed)

- Windows: [git-scm.com/download/win](https://git-scm.com/download/win)
- Restart terminal after install

### 2. Create the repo on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Name: `nova-store` (or your choice)
3. **Private** recommended (contains `.env.example` only — never commit real `.env`)
4. Do **not** add README/license (you already have files)

### 3. Push your project

In PowerShell, from the project folder:

```powershell
cd "C:\Users\zohar\OneDrive\Desktop\projecto"

git init
git add .
git commit -m "Initial commit: NOVA full-stack store"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nova-store.git
git push -u origin main
```

Replace `YOUR_USERNAME/nova-store` with your repo URL.

### 4. GitHub Actions (CI)

This repo includes `.github/workflows/ci.yml`. After push, open **GitHub → Actions** to see build status.

Add these **Repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|--------|--------|
| `VITE_SUPABASE_URL` | From Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | anon public key |
| `JWT_SECRET` | Random 32+ char string |

---

## Part 2 — Supabase project (Auth + Database)

### 1. Create project

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Choose region, set a **database password** (save it)

### 2. Copy API keys

**Project Settings → API**

| Key | Goes in |
|-----|---------|
| Project URL | `.env` → `SUPABASE_URL` and `client/.env` → `VITE_SUPABASE_URL` |
| anon public | `SUPABASE_ANON_KEY` + `VITE_SUPABASE_ANON_KEY` |
| service_role | `.env` → `SUPABASE_SERVICE_ROLE_KEY` (server only, never in client) |

### 3. Database connection string

**Project Settings → Database → Connection string → URI**

Use your project Postgres URL format (example below):

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.uifabtkdvfmlmprxvklm.supabase.co:5432/postgres
USE_SUPABASE_DB=true
```

Paste into root `.env`.

### 4. Run the database schema

**SQL Editor → New query**, paste contents of:

1. `supabase/migrations/20260328000000_nova_schema.sql` → **Run**
2. `supabase/seed.sql` → **Run** (products catalog)

### 5. Enable Google & Apple auth

See **OAUTH_SETUP.md** — same Supabase project.

**Authentication → URL configuration:**

- Site URL: `http://localhost:3000` (dev) or `https://novadeluxe.dpdns.org` (prod)
- Redirect URLs: `http://localhost:3000/auth/callback`, `http://localhost:5173/auth/callback`, production URL + `/auth/callback`

---

## Part 3 — Link GitHub to Supabase (optional)

Supabase can watch your GitHub repo for **database migrations**:

1. Supabase Dashboard → **Project Settings → Integrations**
2. **GitHub** → Connect your account
3. Select repository `YOUR_USERNAME/nova-store`
4. Enable **Automatic branching** / **Deploy migrations** if offered on your plan

Or use Supabase CLI locally:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

`YOUR_PROJECT_REF` is in the project URL: `https://YOUR_PROJECT_REF.supabase.co`

---

## Part 4 — Final `.env` files

**Root `.env`:**

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-long-random-secret-at-least-32-chars
ADMIN_EMAIL=admin@nova.com
ADMIN_PASSWORD=NovaAdmin2026!

SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.uifabtkdvfmlmprxvklm.supabase.co:5432/postgres
USE_SUPABASE_DB=true
```

**`client/.env`:**

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Then:

```bash
npm run build
npm start
```

Startup should log:

- `Supabase: ENABLED`
- `Database: Supabase Postgres` (when `USE_SUPABASE_DB=true`)

---

## Part 5 — Verify

| Check | URL / action |
|-------|----------------|
| Site | http://localhost:3000 |
| Google/Apple login | /login |
| API health | http://localhost:3000/api/health → `"supabase": true` |
| Products in Supabase | Dashboard → Table Editor → `products` (12 rows after seed) |
| GitHub CI | Actions tab green |

---

## SQLite vs Supabase DB

| Mode | Env | Data lives in |
|------|-----|----------------|
| Local default | `USE_SUPABASE_DB` unset | `data/nova.db` (SQLite) |
| Cloud / production | `USE_SUPABASE_DB=true` + `DATABASE_URL` | Supabase Postgres |

OAuth users are stored in the same database you select (SQLite or Postgres).
