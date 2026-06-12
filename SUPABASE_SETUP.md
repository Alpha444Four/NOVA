# Supabase OAuth setup (Google + Apple)

NOVA's authentication is layered:

- **Password login & local users** keep using your SQLite database (`data/nova.db`) and a JWT cookie. Nothing changes.
- **Google / Apple sign-in** is handled by Supabase Auth. After a successful provider login, the client exchanges its Supabase access token for a NOVA JWT cookie via `POST /api/auth/oauth-exchange`, which **creates a matching local user** (so cart, orders, and admin keep working).

This means you can enable / disable OAuth simply by setting environment variables — the rest of the app does not depend on Supabase.

---

## 1. Create a Supabase project

1. Go to <https://supabase.com> → **New project**.
2. Pick a region, set a strong DB password (you won't use it here), wait for provisioning.
3. Open **Project Settings → API** and grab:
   - `Project URL` → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (optional, server-only)

## 2. Add env vars

### Server `.env` (project root)

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # optional
```

### Client `client/.env`

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Restart the server (`npm start`) and rebuild the client (`cd client && npm run build`) — or run Vite dev (`npm run dev`).

When Supabase env vars are present the server logs:

```
Supabase: ENABLED ✓
```

and the login/signup pages show **Continue with Google** / **Continue with Apple** buttons. Without them, OAuth UI hides automatically.

## 3. Configure Supabase redirect URLs

In Supabase **Authentication → URL Configuration**:

- **Site URL:** `https://novadeluxe.dpdns.org`
- **Redirect URLs (add all that apply):**
  - `https://novadeluxe.dpdns.org/auth/callback` ← production
  - `http://localhost:3000/auth/callback`
  - `http://localhost:5173/auth/callback` (Vite dev server)

> The Site URL controls where Supabase sends users when an OAuth flow doesn't
> include an explicit `redirectTo`. Set it to the production domain; keep the
> localhost entries in **Redirect URLs** so local development still works.

## 4. Enable Google

1. Open **Authentication → Providers → Google**.
2. Follow Supabase's prompt to register an OAuth client at <https://console.cloud.google.com> (APIs & Services → Credentials → Create OAuth client ID → Web application).
3. Set the Google **Authorized redirect URI** to the value Supabase shows you (it looks like `https://YOUR_PROJECT.supabase.co/auth/v1/callback`).
4. Paste **Client ID** and **Client Secret** back into Supabase.
5. Toggle **Enabled** → Save.

## 5. Enable Apple (optional)

Apple Sign In requires an Apple Developer account ($99/yr).

1. In **Apple Developer → Certificates, Identifiers & Profiles**:
   - Create an **App ID** with "Sign in with Apple" enabled.
   - Create a **Services ID** — use this as your Apple `Client ID`.
   - Set the Services ID **Return URLs** to `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.
   - Create a private key (.p8) with Sign in with Apple capability — note the **Key ID** and **Team ID**.
2. Open Supabase **Authentication → Providers → Apple**.
3. Paste Services ID, Team ID, Key ID, and the .p8 contents. Save.

If you skip step 5, only Google will show in the UI — Apple buttons will simply 404 until you enable it.

## 6. Test the flow

1. Open <http://localhost:3000/login>.
2. Click **Continue with Google**.
3. Choose a Google account → Supabase redirects back to `/auth/callback`.
4. NOVA exchanges the token, syncs your name + avatar into `data/nova.db`, issues a JWT cookie, and redirects to `/account`.

You can see the linked user in the Admin panel (Customers list shows `provider = google`).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| OAuth buttons don't appear | Check `/api/health` → `supabase: true`. Confirm both server `.env` and `client/.env` have the keys, then **rebuild** the client (`cd client && npm run build`). |
| "redirect_uri mismatch" | Add `http://localhost:3000/auth/callback` (and any other dev/prod URLs) in Supabase **URL Configuration**. |
| "OAuth provider did not return an email" | The user denied email permission. Re-prompt with email scope required (Google does this by default; some providers don't). |
| Session not persisted | Ensure cookies are allowed for `localhost`. The cookie is `HttpOnly`; you can verify in DevTools → Application → Cookies. |
| Apple keeps failing | Apple requires HTTPS in production. Use a real domain with TLS for the callback (Supabase's `*.supabase.co` URL is HTTPS already, so the dance works in dev). |

---

## Security notes

- The Supabase **anon** key is safe to expose to the browser.
- The **service_role** key is server-only — never reference `SUPABASE_SERVICE_ROLE_KEY` from any `client/**` file.
- Local users created from OAuth have **no password hash** (`password_hash IS NULL`). The login route refuses email/password login for those accounts.
- Logging out clears both the NOVA JWT cookie and the Supabase session.
