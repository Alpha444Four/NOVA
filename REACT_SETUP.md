# NOVA React App

The storefront is now a **premium React + Tailwind + Framer Motion** SPA in `client/`. The Express API and admin panel (`admin.html`) are unchanged.

## Quick start (development)

**Terminal 1 — API**
```bash
npm start
```

**Terminal 2 — React (hot reload)**
```bash
cd client
npm run dev
```

Open **http://localhost:5173** (API proxied to port 3000).

## Production (single server)

```bash
cd client && npm run build
cd .. && npm start
```

Open **http://localhost:3000** — React app + API on one port.

## UI/UX Pro Max (Cursor)

Installed via:

```bash
npx uipro init --ai cursor
```

Skills live in `.cursor/skills/` — restart Cursor after install.

## shadcn component path

All UI primitives belong in **`client/src/components/ui/`** (matches `components.json` aliases: `@/components/ui`).

Integrated components:

| File | Usage |
|------|--------|
| `spotlight-card.tsx` | `GlowCard` — homepage “Curated picks” spotlight row |
| `popover.tsx` | Profile menu in navbar |
| `footer-theme-bar.tsx` | Theme toggle + scroll-to-top in footer |
| `avatar.tsx` | Profile popover (with `AvatarImage`) |

We use **lucide-react** instead of `dicons`, and **React Router** instead of Next.js `Link` / `next-themes`.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn-style UI (`client/src/components/ui/`)
- Framer Motion animations
- react-router-dom (protected `/account` dashboard)
- react-hook-form + zod
- recharts (account dashboard)
- lucide-react icons
- Dark/light theme → `localStorage` key `nova-theme`

## Routes

| Path | Access |
|------|--------|
| `/` | Public store |
| `/login` | Public |
| `/signup` | Public |
| `/account` | Logged-in users only |
| `/admin.html` | Admin (vanilla panel) |

## Admin

Admins signing in are redirected to `/admin.html` (control panel).
