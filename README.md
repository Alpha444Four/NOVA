# NOVA Store

Full-stack e-commerce: vanilla storefront + Express API + SQLite, with an animated gradient hero and optional React demo.

## Quick start

1. Install [Node.js](https://nodejs.org/) 18+
2. Double-click **`START.bat`** (or run `npm install` then `npm start`)
3. Open **http://localhost:3000**

### Admin

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` (copied from `.env.example` on first run).  
Default: `admin@nova.com` / `NovaAdmin2026!` → http://localhost:3000/admin.html

## GitHub + Supabase database

To push this repo to **GitHub** and run the app on **Supabase Postgres** (not local SQLite), follow:

**[CONNECT_GITHUB_SUPABASE.md](./CONNECT_GITHUB_SUPABASE.md)**

Set `USE_SUPABASE_DB=true` and `DATABASE_URL` in `.env` (format: `postgresql://postgres:[YOUR-PASSWORD]@db.uifabtkdvfmlmprxvklm.supabase.co:5432/postgres`) after creating your Supabase project and running the SQL in `supabase/migrations/` and `supabase/seed.sql`.

## What's included

| Area | URL |
|------|-----|
| Shop & landing | `/` or `index.html` |
| Login / Sign up | `/login`, `/signup` (Google & Apple via Supabase — see `OAUTH_SETUP.md`) |
| Account & orders | `account.html` |
| Help (shipping, returns, FAQ) | `help.html` |
| Admin panel | `admin.html` |
| React gradient demo (optional) | `/gradient-demo/` |

## Scripts

```bash
npm start              # API + static site (port 3000)
npm run client:dev     # React dev server (port 5173)
npm run client:build   # Build React demo to client/dist
```

## Google & Apple sign-in

1. Create a [Supabase](https://supabase.com) project and enable **Google** + **Apple** providers  
2. Copy keys to `.env` and `client/.env`  
3. `npm run build && npm start`  
4. Open **/login** — use **Continue with Google** or **Continue with Apple**

Full steps: **[OAUTH_SETUP.md](./OAUTH_SETUP.md)**

## Stack

- **Backend:** Express, better-sqlite3, JWT cookies, Supabase OAuth exchange
- **Frontend:** React SPA in `client/` (see `REACT_SETUP.md`)
- **Admin:** `admin.html` control panel

## Production

Live domain: **<https://novadeluxe.dpdns.org>** (free dynamic DNS via dpdns.org).

See **[`DEPLOY.md`](./DEPLOY.md)** for the full deployment playbook:

- Pointing the dpdns.org A record at your host
- Reverse-proxy options (Caddy with automatic HTTPS, or nginx + Certbot)
- Running the Node process under PM2 (`ecosystem.config.js`) or NSSM on Windows
- Production `.env` checklist and Supabase OAuth redirect URLs
- Post-deploy smoke tests

## AI setup (Cursor + Claude Code)

One command installs UI/UX Pro Max and syncs project skills:

```powershell
npm run skills:install
```

Or manually:

```bash
npx uipro init --ai cursor
```

| Tool | Skills location | Project guide |
|------|-----------------|---------------|
| **Cursor** | `.cursor/skills/` | `nova-store`, `ui-ux-pro-max` |
| **Claude Code** | `.claude/skills/` | same + read `CLAUDE.md` |

**Claude Code** (already on your machine if `claude --version` works):

```powershell
# Install / update (Windows native — recommended)
irm https://claude.ai/install.ps1 | iex

# Use in this project
cd C:\Users\zohar\OneDrive\Desktop\projecto
claude
```

First run opens browser login for your Anthropic account. Type `/help` in Claude Code to see loaded skills.
