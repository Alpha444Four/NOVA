# Push your full local NOVA folder to GitHub safely

Use this checklist when your **PC has the complete project** (React `client/`, full `server/`, `css/`, `js/`, etc.) but GitHub only has a partial copy.

Target repo: **https://github.com/Alpha444Four/NOVA**

---

## Before you start

1. **Back up** your local folder (copy `projecto` somewhere safe).
2. Install [Git for Windows](https://git-scm.com/download/win) if needed.
3. Open **PowerShell** or **Git Bash** in your project folder, e.g.:

   ```powershell
   cd C:\Users\zohar\OneDrive\Desktop\projecto
   ```

4. Confirm you have the full app:

   ```powershell
   dir client\src
   dir server\routes
   dir data\nova.db
   ```

   If `client\src` is missing, you are not on the full codebase yet.

---

## 1. Never commit secrets or local-only files

The repo `.gitignore` already excludes:

| Path | Why |
|------|-----|
| `.env`, `client/.env` | API keys, DB passwords, JWT secret |
| `node_modules/`, `client/node_modules/` | Reinstall with `npm install` |
| `data/`, `*.db` | Local SQLite — use Supabase on Vercel instead |
| `client/dist/` | Rebuild with `cd client && npm run build` |
| `.vercel` | Local Vercel link metadata |

**Double-check** before every push:

```powershell
git status
```

If `.env` or `nova.db` appear, run:

```powershell
git restore --staged .env
git restore --staged data\nova.db
```

Add missing patterns to `.gitignore` if needed.

---

## 2. Connect local folder to GitHub (first time)

If this folder is **not** a git repo yet:

```powershell
git init
git remote add origin https://github.com/Alpha444Four/NOVA.git
git fetch origin
git checkout -b main
```

If it is already a repo but remote is wrong:

```powershell
git remote -v
git remote set-url origin https://github.com/Alpha444Four/NOVA.git
```

---

## 3. Sync with GitHub without losing local work

```powershell
git fetch origin
git pull origin main --rebase
```

If you have uncommitted local changes:

```powershell
git stash push -m "local work"
git pull origin main --rebase
git stash pop
```

Resolve any merge conflicts in your editor, then:

```powershell
git add .
git rebase --continue
```

---

## 4. Stage only what should be public

Review every file:

```powershell
git status
git diff --stat
```

Stage the full app (typical):

```powershell
git add client server public css js assets admin.html index.html package.json package-lock.json
git add supabase vercel.json api scripts .github
git add README.md CLAUDE.md .gitignore
```

**Do not** stage:

- `.env` / `client/.env`
- `data/nova.db`
- `node_modules/`

---

## 5. Commit and push

```powershell
git commit -m "Add full NOVA storefront (React client, Express API, static assets)"
git push -u origin main
```

If push is rejected (remote has newer commits):

```powershell
git pull origin main --rebase
git push origin main
```

---

## 6. Verify on GitHub

1. Open https://github.com/Alpha444Four/NOVA — confirm folders exist: `client/`, `server/`, `public/` or root HTML.
2. Check **Actions** tab — CI should pass.
3. Vercel redeploys automatically if the project is linked to this repo.

---

## 7. After push — Vercel env vars

Pushing code does **not** copy `.env`. Set secrets in **Vercel → Project → Settings → Environment Variables**. See [SUPABASE_VERCEL.md](./SUPABASE_VERCEL.md).

Minimum for production:

| Variable | Example |
|----------|---------|
| `JWT_SECRET` | 48+ random characters |
| `NODE_ENV` | `production` |
| `ADMIN_EMAIL` | your admin email |
| `ADMIN_PASSWORD` | strong password |
| `PUBLIC_URL` | `https://nova-nine-rust.vercel.app` |
| `CORS_ORIGINS` | same as `PUBLIC_URL` |
| `USE_SUPABASE_DB` | `true` |
| `DATABASE_URL` | Supabase Postgres connection string |

Redeploy after adding variables.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Permission denied (publickey)` | Use HTTPS remote or add SSH key to GitHub |
| Large file rejected (>100 MB) | Remove from history; never commit `node_modules` or `.db` |
| Merge conflicts in `package-lock.json` | Run `npm install`, commit the regenerated lockfile |
| Vercel still shows old site | Trigger **Redeploy** in Vercel dashboard |
| Login works locally but not on Vercel | Set `JWT_SECRET`, `PUBLIC_URL`, `CORS_ORIGINS`; cookies need HTTPS |

---

## Optional: push from a clean clone

If your folder is messy, clone fresh and copy files in:

```powershell
cd C:\Users\zohar\OneDrive\Desktop
git clone https://github.com/Alpha444Four/NOVA.git NOVA-clean
# Copy your client/, server/, etc. into NOVA-clean (skip .env and data/)
cd NOVA-clean
npm install
cd client && npm install && npm run build
cd ..
git add .
git commit -m "Sync full local NOVA codebase"
git push origin main
```
