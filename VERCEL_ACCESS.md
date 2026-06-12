# Fix Vercel access for NOVA

The Cloud Agent and GitHub Actions need **one-time setup** before CLI/MCP deploys work. Pick **Option A** (fastest) or **Option B** (full CI/CD).

---

## Option A — Vercel ↔ GitHub (recommended, no tokens in repo)

1. Open **[vercel.com/new](https://vercel.com/new)** and sign in.
2. **Import** `Alpha444Four/NOVA` → branch **`main`**.
3. Leave **Framework Preset** as auto-detected (Express) or **Other**.
4. **Build command:** `npm run build`
5. Add **Environment Variables** (Production):

   | Name | Value |
   |------|--------|
   | `JWT_SECRET` | 48+ random characters |
   | `NODE_ENV` | `production` |
   | `ADMIN_EMAIL` | `admin@nova.com` |
   | `ADMIN_PASSWORD` | your admin password |
   | `PUBLIC_URL` | `https://YOUR-PROJECT.vercel.app` (update after first deploy) |
   | `CORS_ORIGINS` | same as `PUBLIC_URL` |

6. Click **Deploy**. Every push to `main` redeploys automatically.

If a previous deploy failed, open **Deployments → Redeploy** on the latest `main` commit.

---

## Option B — GitHub Actions + `VERCEL_TOKEN`

Use this if you want deploys from **Actions** or need the Cursor **Vercel MCP** tools.

### 1. Create a Vercel token

1. [vercel.com/account/tokens](https://vercel.com/account/tokens) → **Create Token**
2. Name it `github-nova-deploy` → copy the token (`vcp_...`)

### 2. Get Org + Project IDs

After importing the project in Vercel (Option A step 2):

1. **Project → Settings → General**
2. Copy **Project ID**
3. Copy **Team / Personal Account ID** (Org ID)

Or from a machine where you ran `vercel link`, read `.vercel/project.json`.

### 3. Add GitHub repository secrets

**GitHub → Alpha444Four/NOVA → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|--------|
| `VERCEL_TOKEN` | `vcp_...` from step 1 |
| `VERCEL_ORG_ID` | Team or user ID |
| `VERCEL_PROJECT_ID` | Project ID |

### 4. Run deploy

- Push to `main`, or
- **Actions → Deploy to Vercel → Run workflow**

---

## Option C — Cursor Vercel MCP (for Cloud Agent)

1. In **Cursor Desktop** → **Settings → MCP**
2. Find **Vercel** → click **Authenticate** / **Connect**
3. Complete the browser login

After auth, Cloud Agents can use Vercel MCP tools for deploys and logs.

Optional: add `VERCEL_TOKEN` to **Cursor Cloud Agent environment secrets** so the CLI can run `vercel deploy` in the agent VM.

---

## Verify a live deploy

```bash
curl https://YOUR-PROJECT.vercel.app/api/health
```

Expected: `{"ok":true,"service":"nova-store",...}`
