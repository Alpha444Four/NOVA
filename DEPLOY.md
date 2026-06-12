# Deploying NOVA Store to `novadeluxe.dpdns.org`

This guide takes a fresh server and gets the NOVA Store running at
**https://novadeluxe.dpdns.org** with HTTPS, a reverse proxy, and a process
manager that restarts the app if it crashes or the box reboots.

The stack is a single Node.js process (Express on port 3000) that also serves
the built React SPA from `client/dist`, plus a SQLite file at `data/nova.db`.

---

## TL;DR — two paths

| Path | Time | When to pick it |
|------|------|-----------------|
| **A. Caddy quick path** | ~10 min | You just want it live. Caddy gets a free Let's Encrypt cert automatically. |
| **B. nginx classic path** | ~20 min | You already run nginx on the box, or you need fine-grained config. |

Both paths share the same build, environment, and PM2 steps — only the
reverse-proxy section differs.

---

## 1. Point the domain at the host

`dpdns.org` is a free dynamic-DNS provider. You manage records through their
control panel (`https://dpdns.org/`):

1. Sign in to the dpdns.org dashboard.
2. Open the `novadeluxe` subdomain (or create it under your dpdns.org account).
3. Add records pointing to the public IP of your deploy host:
   - **A** record → IPv4 of the server.
   - **AAAA** record → IPv6 if you have one (optional).
4. If the host's IP changes (residential / NAT), install the dpdns.org
   dynamic-update client they recommend so the A record stays current.
5. Wait 1–5 minutes, then verify with:

   ```bash
   nslookup novadeluxe.dpdns.org
   # or
   dig +short novadeluxe.dpdns.org
   ```

   You should see your host's IP.

> The TTL is short on dynamic DNS, so propagation is fast — usually under a
> minute.

---

## 2. Build the app on the host

```bash
git clone <your repo URL> nova-store
cd nova-store

# Server deps
npm ci           # or `npm install` if no lockfile
# Build the React SPA into client/dist (Express serves it)
cd client && npm ci && npm run build && cd ..
```

> On Windows shells use `npm.cmd` instead of `npm`.

---

## 3. Configure environment

Copy the template and fill in real values:

```bash
cp .env.example .env
# edit .env
```

Production checklist for `.env`:

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` — at least 32 random chars. Generate one:
      `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- [ ] `ADMIN_EMAIL` and `ADMIN_PASSWORD` — change from the defaults.
- [ ] `PUBLIC_URL=https://novadeluxe.dpdns.org`
- [ ] `CORS_ORIGINS=https://novadeluxe.dpdns.org,http://novadeluxe.dpdns.org`
      (Add `http://localhost:5173` too if you still use the box for dev.)
- [ ] `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — only
      if you enabled Google/Apple OAuth. See `SUPABASE_SETUP.md`.

Also create `client/.env` if Supabase OAuth is on:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Then rebuild the client so the keys are baked into the bundle:

```bash
cd client && npm run build && cd ..
```

---

## 4. Open the firewall (Windows)

If you are deploying to Windows (which the dev workspace uses), open ports 80
and 443. From an elevated PowerShell / cmd:

```powershell
netsh advfirewall firewall add rule name="NOVA HTTP"  dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="NOVA HTTPS" dir=in action=allow protocol=TCP localport=443
```

There's also a one-shot helper that runs the same commands idempotently and
self-elevates via UAC:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\open-firewall-elevate.ps1
```

On Linux, allow the same ports with your firewall of choice
(`ufw allow 80,443/tcp`, `firewall-cmd --add-service=http --add-service=https`,
etc.).

You **do not** need to expose port 3000 to the internet — the reverse proxy
talks to it on `127.0.0.1`.

---

## 5. Run the app under a process manager (PM2 — primary)

PM2 keeps the Node process alive, restarts on crash, and survives reboots.

```bash
npm install -g pm2

# Start using the included ecosystem.config.js
pm2 start ecosystem.config.js

# Inspect
pm2 status
pm2 logs nova-store --lines 100

# Persist across reboots (Linux/macOS)
pm2 save
pm2 startup        # follow the printed command (it sets up a systemd unit)

# Persist across reboots (Windows)
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

The bundled `ecosystem.config.js` is:

```js
module.exports = {
  apps: [{
    name: "nova-store",
    script: "server/index.js",
    env: { NODE_ENV: "production", PORT: 3000 },
    max_restarts: 10,
    autorestart: true,
  }],
};
```

### Alternative: NSSM on Windows

If PM2 is awkward on your Windows host, run the server as a native service via
[NSSM](https://nssm.cc/):

```powershell
# Download nssm.exe and put it somewhere on PATH
nssm install NovaStore "C:\Program Files\nodejs\node.exe" "C:\path\to\nova-store\server\index.js"
nssm set NovaStore AppDirectory "C:\path\to\nova-store"
nssm set NovaStore AppStdout "C:\path\to\nova-store\logs\nova.out.log"
nssm set NovaStore AppStderr "C:\path\to\nova-store\logs\nova.err.log"
nssm set NovaStore Start SERVICE_AUTO_START
nssm start NovaStore
```

Stop / remove later with `nssm stop NovaStore` / `nssm remove NovaStore confirm`.

---

## 6A. Reverse proxy: **Caddy** (preferred, automatic HTTPS)

Caddy is one binary that terminates TLS and proxies to Node. It fetches and
renews a Let's Encrypt certificate automatically — no Certbot, no cron job.

1. Install Caddy: <https://caddyserver.com/docs/install>
2. Drop the `Caddyfile` from this repo into Caddy's config directory
   (`/etc/caddy/Caddyfile` on Linux, or wherever you keep it on Windows).
3. Make sure ports 80 and 443 are reachable from the internet (firewall + any
   NAT rules on your router).
4. Start / reload Caddy:

   ```bash
   sudo systemctl reload caddy        # Linux service
   # or, foreground:
   caddy run --config ./Caddyfile
   ```

The full `Caddyfile` (matches the one committed at the repo root):

```
# HTTP listener for novadeluxe.dpdns.org.
# - /api/health is served directly so smoke tests / load-balancer probes work
#   without TLS.
# - Everything else 301s to HTTPS so real traffic is always on TLS.
http://novadeluxe.dpdns.org {
	@health path /api/health
	handle @health {
		reverse_proxy 127.0.0.1:3000
	}
	handle {
		redir https://{host}{uri} permanent
	}
}

# HTTPS listener (auto-TLS via Let's Encrypt).
novadeluxe.dpdns.org {
	encode zstd gzip
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
		-Server
	}
	reverse_proxy 127.0.0.1:3000
}
```

That's it — visit `https://novadeluxe.dpdns.org` and you should see the store.

### Caddy on Windows (this dev box)

```powershell
# Install once (winget is preinstalled on modern Windows)
winget install --id CaddyServer.Caddy -e --silent --accept-source-agreements --accept-package-agreements

# Run in foreground (keep window open)
caddy run --config c:\Users\zohar\OneDrive\Desktop\projecto\Caddyfile

# Or run detached (returns immediately, Caddy keeps running)
caddy start --config c:\Users\zohar\OneDrive\Desktop\projecto\Caddyfile

# Reload after editing the Caddyfile
caddy reload --config c:\Users\zohar\OneDrive\Desktop\projecto\Caddyfile

# Stop the detached process
caddy stop
```

If winget didn't add `caddy` to your PATH yet, the binary lives at:
`C:\Users\zohar\AppData\Local\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe`

To run Caddy as a real Windows service that survives reboots, the easiest
route is [NSSM](https://nssm.cc/) — see Step 5 above for the install pattern,
then run:

```powershell
nssm install Caddy "C:\Users\zohar\AppData\Local\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe" "run --config c:\Users\zohar\OneDrive\Desktop\projecto\Caddyfile"
nssm set Caddy AppDirectory "c:\Users\zohar\OneDrive\Desktop\projecto"
nssm set Caddy Start SERVICE_AUTO_START
nssm start Caddy
```

---

## 6B. Reverse proxy: **nginx** (classic path)

If you prefer nginx, here is a minimal config. It assumes you already have a
TLS cert from Certbot (`sudo apt install certbot python3-certbot-nginx`).

`/etc/nginx/sites-available/novadeluxe.dpdns.org`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name novadeluxe.dpdns.org;

    # Let Certbot solve HTTP-01 challenges, redirect everything else to HTTPS.
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name novadeluxe.dpdns.org;

    ssl_certificate     /etc/letsencrypt/live/novadeluxe.dpdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/novadeluxe.dpdns.org/privkey.pem;

    client_max_body_size 2m;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/novadeluxe.dpdns.org /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get / renew the cert (Certbot edits the server block automatically too)
sudo certbot --nginx -d novadeluxe.dpdns.org
```

Certbot's systemd timer will renew the certificate every ~60 days.

---

## 7. Smoke tests after deploy

Run these from any machine after DNS and the reverse proxy are live:

```bash
# 1. Health endpoint should return JSON with ok: true
curl -i https://novadeluxe.dpdns.org/api/health

# 2. Storefront should render the SPA shell
curl -I https://novadeluxe.dpdns.org/

# 3. Admin redirects unauthenticated users to /login?from=/admin.html
curl -I https://novadeluxe.dpdns.org/admin.html
```

Then in a browser:

1. Open `https://novadeluxe.dpdns.org/` — confirm products load, theme toggle
   works, navbar renders.
2. Sign up / log in as a regular user.
3. Log in as the admin (`ADMIN_EMAIL` + `ADMIN_PASSWORD` from `.env`) — you
   should be redirected to `/admin.html`.
4. (If Supabase configured) hit **Continue with Google** on `/login` and check
   that the Supabase redirect lands you back on `/auth/callback` and then
   `/account`.

---

## 8. Updating the app

```bash
cd nova-store
git pull
npm ci                                # picks up server dep changes
cd client && npm ci && npm run build  # rebuild the SPA
cd ..
pm2 restart nova-store
```

---

## 9. Common gotchas

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Login works but next request is 401 | Cookie not sent — `secure` is true but you visited via HTTP | Make sure the browser is on `https://novadeluxe.dpdns.org`. |
| CORS error from a different subdomain | Origin missing from `CORS_ORIGINS` | Add the origin and `pm2 restart nova-store`. |
| Admin redirect loops | Browser blocked the cookie (third-party cookie settings) | The cookie is `SameSite=Lax`, same-origin — confirm you're on the production domain, not the IP. |
| `EADDRINUSE` on start | Another process holds port 3000 | `pm2 list`, `pm2 delete nova-store`, free the port, start again. |
| HTTPS shows "Not secure" | Caddy still issuing cert, or DNS not propagated | Wait a minute, then `caddy reload`. Check `journalctl -u caddy`. |
