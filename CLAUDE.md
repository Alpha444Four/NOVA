# NOVA Store — Claude Code project guide

Premium full-stack e-commerce (React SPA + Express API + SQLite).

## Architecture

| Layer | Path | Notes |
|-------|------|--------|
| React storefront | `client/src/` | Vite, Tailwind, Framer Motion, shadcn-style UI in `components/ui/` |
| Express API | `server/` | Auth (JWT cookies), products, cart, orders, admin, newsletter |
| Admin panel | `admin.html` + `js/admin.js` + `css/admin.css` | Separate from React; admins only |
| Database | `data/nova.db` | SQLite via better-sqlite3; migrations in `server/db.js` |

## Run locally

```bash
# Terminal 1 — API + production React build
npm start

# Terminal 2 — React dev (hot reload)
cd client && npm run dev
```

- Dev UI: http://localhost:5173 (proxies `/api` → 3000)
- Production: http://localhost:3000
- Admin: http://localhost:3000/admin.html

Use `npm.cmd` on Windows if PowerShell blocks `npm` scripts.

## Conventions

- **Do not break** the Express API contract used by `client/src/lib/api.ts`.
- New UI components: `client/src/components/ui/` (shadcn path alias `@/components/ui`).
- Theme key: `localStorage` `nova-theme` (light/dark).
- Cart guest key: `nova-cart`; newsletter discount uses `GET /api/newsletter/check` for logged-in email.
- Protected React route: `/account` (requires login). Admin users redirect to `/admin.html` after login.

## Common tasks

| Task | Where to edit |
|------|----------------|
| Storefront pages | `client/src/pages/`, `client/src/components/` |
| API routes | `server/routes/` |
| DB schema / seed | `server/db.js` |
| Admin features | `admin.html`, `js/admin.js`, `server/routes/admin.js` |

## Skills in this repo

- `.claude/skills/nova-store/` — NOVA-specific workflows (Claude Code)
- `.claude/skills/ui-ux-pro-max/` — UI/UX design system (also in `.cursor/skills/`)
- `.cursor/skills/` — Same skills for Cursor Agent

After adding skills, restart Claude Code if `.claude/skills/` did not exist when the session started.

## Quality bar

- Premium, minimal UI — match existing Tailwind tokens in `client/src/index.css`.
- Full responsive + accessible (keyboard, aria labels).
- No secrets in git (`.env` only locally).
- Run `cd client && npm run build` before finishing UI changes.
