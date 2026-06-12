# DNS setup for `novadeluxe.dpdns.org`

Use this checklist after NOVA, Caddy, and PM2 are running on this PC. Full deploy details live in [DEPLOY.md](./DEPLOY.md).
---

## Status (last checked: 2026-05-26)

| Check | Result |
|-------|--------|
| Public IPv4 (icanhazip / ifconfig.me) | **197.145.224.169** (matches A record below) |
| 
slookup novadeluxe.dpdns.org @ 8.8.8.8 | **FAIL** — name does not exist (NXDOMAIN / Server failed) |
| 
slookup novadeluxe.dpdns.org @ 1.1.1.1 | **FAIL** — same |
| Parent zone dpdns.org | Resolves (provider is up; **your subdomain is not registered yet**) |
| NOVA local health | OK (http://127.0.0.1:3000/api/health) |
| Caddy → NOVA (Host header) | OK (http://127.0.0.1/api/health) |
| Caddy Let's Encrypt cert | **Not issued** — no cert files yet; ACME needs a public DNS name that points here |
| Windows firewall 80/443 | **Allow rules present** (NOVA HTTP / NOVA HTTPS) |
| Public **https://novadeluxe.dpdns.org** | **Does not work** until DNS + router port forward are fixed |

**You must sign in at [dpdns.org](https://dpdns.org/) yourself** — this deploy cannot create or edit your dpdns account.

### If 
slookup still fails after you save DNS

1. Confirm the hostname is exactly **
ovadeluxe.dpdns.org** (not a typo, not a different TLD).
2. In the dpdns panel, create/register the **novadeluxe** host under **dpdns.org** (some panels call it "add subdomain" or "new dynamic host").
3. Set an **A record** to **197.145.224.169** (re-run curl.exe -s https://icanhazip.com if your ISP may have changed your IP).
4. Wait 1–5 minutes, then run:

   `powershell
   nslookup novadeluxe.dpdns.org 8.8.8.8
   `

   Expected answer: **197.145.224.169**. Until you see that, HTTPS and the public site **cannot** work.

5. Forward **TCP 80 and 443** on your router to this PC (see table below). Without that, Let's Encrypt validation from the internet will fail even after DNS is correct.

6. After DNS shows the right IP, restart Caddy once (or wait); it will request the certificate automatically. Then test:

   `powershell
   curl.exe -s https://novadeluxe.dpdns.org/api/health
   `


---

## Your public IPv4 (for the A record)

**`197.145.224.169`**

Verified via `https://api.ipify.org` on deploy date. If your ISP assigns a dynamic IP, re-check before updating DNS:

```powershell
curl.exe -s https://api.ipify.org
```

---

## Configure dpdns.org

1. Sign in at [https://dpdns.org/](https://dpdns.org/).
2. Open or create the subdomain **`novadeluxe`** under your account.
3. Add a DNS record:
   - **Type:** `A`
   - **Host / name:** `@` or `novadeluxe` (match whatever the dpdns.org panel expects for the full name `novadeluxe.dpdns.org`)
   - **Value / points to:** `197.145.224.169`
   - **TTL:** default (often 60–300 s on dynamic DNS)
4. Save. Wait **1–5 minutes**, then verify:

```powershell
nslookup novadeluxe.dpdns.org
# Expect: 197.145.224.169
```

5. If your home IP changes, enable the **dpdns.org dynamic update client** (or update the A record manually) so the name stays correct.

---

## Router / NAT (required for HTTPS)

Forward inbound traffic from the internet to **this PC’s LAN IP**:

| External port | Internal port | Protocol | Target |
|---------------|---------------|----------|--------|
| 80            | 80            | TCP      | This PC |
| 443           | 443           | TCP      | This PC |

Without 80/443 forwarded, Let’s Encrypt (Caddy) cannot issue a certificate and the site will not load from the public internet.

---

## Windows firewall (run once as Administrator)

Inbound rules for TCP **80** and **443** were **not** confirmed on this machine (creation failed without elevation). Run **one** of:

**Option A — helper script (UAC prompt):**

```powershell
cd c:\Users\zohar\OneDrive\Desktop\projecto
powershell -ExecutionPolicy Bypass -File scripts\open-firewall-elevate.ps1
```

**Option B — elevated cmd:**

```cmd
netsh advfirewall firewall add rule name="NOVA HTTP"  dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="NOVA HTTPS" dir=in action=allow protocol=TCP localport=443
```

---

## After DNS propagates — verification

```powershell
# Direct Node (no proxy)
curl.exe -s http://127.0.0.1:3000/api/health

# Through Caddy on port 80 (Host header required locally)
curl.exe -s -H "Host: novadeluxe.dpdns.org" http://127.0.0.1/api/health

# Public HTTPS (works once DNS + port-forward + firewall are OK)
curl.exe -s https://novadeluxe.dpdns.org/api/health
```

Caddy will obtain a Let’s Encrypt certificate automatically the first time `novadeluxe.dpdns.org` resolves to this host and port 80 is reachable from the internet.

---

## Process manager (NOVA)

- **PM2** app name: `nova-store` (see `ecosystem.config.js`)
- **Windows reboot persistence:** `pm2-windows-startup` registry entry installed (`pm2-startup install` + `pm2 save`)

```powershell
pm2 list
pm2 logs nova-store --lines 50
pm2 restart nova-store
```

---

## Caddy on this PC

Caddy should listen on **0.0.0.0:80** and **0.0.0.0:443** and proxy to `127.0.0.1:3000`.

If it is not running after a reboot, start it from the project root:

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe" run --config c:\Users\zohar\OneDrive\Desktop\projecto\Caddyfile
```

Or detached: `caddy start --config ...` (see DEPLOY.md §6A for NSSM service setup so Caddy survives reboots).

---

## Security warning — change default admin password

> **`.env` still uses the default `ADMIN_PASSWORD=NovaAdmin2026!`.**
>
> Change `ADMIN_PASSWORD` (and confirm `JWT_SECRET` is a long random value) **before** exposing the site on the public internet. Then run `pm2 restart nova-store`.

Do not commit `.env` or paste secrets into chat.

---

## Current local status (last deploy pass)

| Check | Expected |
|-------|----------|
| `http://127.0.0.1:3000/api/health` | `{"ok":true,...}` |
| Caddy + Host header on port 80 | `{"ok":true,...}` |
| `nslookup novadeluxe.dpdns.org` | Fails until A record is set |
| `https://novadeluxe.dpdns.org/api/health` | Works after DNS + router + firewall |
