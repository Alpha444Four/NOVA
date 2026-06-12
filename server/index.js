require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");

const db = require("./db");
const auth = require("./middleware/auth");
const { createCorsOptions } = require("./cors");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(createCorsOptions()));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const supabaseEnabled = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
);

app.get("/api/health", async (_req, res) => {
  await db.ready();
  const dbInfo = db.getDiagnostics();
  res.json({
    ok: true,
    service: "nova-store",
    supabase: supabaseEnabled,
    database: dbInfo.mode,
    postgresConfigured: dbInfo.postgresConfigured,
    hint: dbInfo.hint,
    timestamp: new Date().toISOString(),
  });
});

async function handleRegister(req, res) {
  await db.ready();
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (await db.findUserByEmail(email.trim())) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }
  const user = await db.createUser({ name: name.trim(), email: email.trim(), password });
  const token = auth.signToken(user);
  auth.setAuthCookie(res, token);
  res.status(201).json({ user: db.publicUser(user) });
}

app.post("/api/auth/register", handleRegister);
app.post("/api/auth/signup", handleRegister);

app.post("/api/auth/login", async (req, res) => {
  await db.ready();
  const { email, password } = req.body || {};
  const user = await db.findUserByEmail(email || "");
  if (!user || !(await db.verifyPassword(user, password || ""))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = auth.signToken(user);
  auth.setAuthCookie(res, token);
  res.json({ user: db.publicUser(user) });
});

app.post("/api/auth/logout", (_req, res) => {
  auth.clearAuthCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth/me", auth.requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/products", async (req, res) => {
  await db.ready();
  const products = await db.getProducts({
    category: req.query.category,
    q: req.query.q,
    sort: req.query.sort,
  });
  res.json({ products });
});

app.get("/api/products/search", async (req, res) => {
  await db.ready();
  const q = (req.query.q || "").trim();
  const products = q ? (await db.getProducts({ q })).slice(0, 8) : [];
  res.json({ products });
});

app.post("/api/newsletter/subscribe", async (req, res) => {
  await db.ready();
  const email = (req.body?.email || "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Valid email required" });
  }
  await db.subscribeNewsletter(email);
  res.json({ ok: true, code: "NOVA15" });
});

app.get("/api/newsletter/check", auth.requireAuth, async (req, res) => {
  await db.ready();
  res.json({ subscribed: await db.isNewsletterSubscriber(req.user.email) });
});

app.post("/api/orders", auth.requireAuth, async (req, res) => {
  await db.ready();
  const { items, shipping, paymentMethod, applyDiscount } = req.body || {};
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Cart is empty" });
  }
  if (!shipping?.name || !shipping?.address || !shipping?.city || !shipping?.zip) {
    return res.status(400).json({ error: "Complete shipping address required" });
  }

  let discountEligible = false;
  if (applyDiscount) {
    discountEligible = await db.isNewsletterSubscriber(req.user.email);
  }

  try {
    const order = await db.createOrder(req.user.id, items, {
      ...shipping,
      email: shipping.email || req.user.email,
    }, {
      paymentMethod: paymentMethod === "card" ? "card" : "cod",
      applyDiscount: discountEligible,
    });

    res.status(201).json({
      order: {
        id: order.id,
        total: order.total,
        orderStatus: order.orderStatus,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Could not create order" });
  }
});

app.get("/api/orders", auth.requireAuth, async (req, res) => {
  await db.ready();
  res.json({ orders: await db.getOrdersForUser(req.user.id) });
});

app.get("/api/admin/stats", auth.requireAdmin, async (_req, res) => {
  await db.ready();
  res.json(await db.adminStats());
});

app.get("/api/admin/products", auth.requireAdmin, async (_req, res) => {
  await db.ready();
  res.json({ products: await db.getAdminProducts() });
});

app.get("/api/admin/orders", auth.requireAdmin, async (_req, res) => {
  await db.ready();
  res.json({ orders: await db.getAdminOrders() });
});

app.get("/api/admin/users", auth.requireAdmin, async (_req, res) => {
  await db.ready();
  res.json({ users: await db.getAdminUsers() });
});

app.get("/api/admin/newsletter", auth.requireAdmin, async (_req, res) => {
  await db.ready();
  res.json({ subscribers: await db.getNewsletterSubscribers() });
});

app.post("/api/auth/oauth-exchange", (_req, res) => {
  if (!supabaseEnabled) {
    return res.status(503).json({ error: "OAuth is not configured on this deployment" });
  }
  res.status(501).json({ error: "OAuth exchange is not implemented in this build" });
});

if (!process.env.VERCEL) {
  const clientDist = path.join(__dirname, "..", "client", "dist");
  const publicDir = path.join(__dirname, "..", "public");
  const staticRoot = fs.existsSync(path.join(clientDist, "index.html")) ? clientDist : publicDir;
  app.use(express.static(staticRoot));
  app.use(express.static(publicDir));
  if (staticRoot === clientDist) {
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.endsWith(".html")) return next();
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }
}

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  if (res.headersSent) return;
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

if (require.main === module) {
  db.ready()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`NOVA Store → http://localhost:${PORT}`);
        console.log(`Database: ${db.getMode()}`);
        console.log(`Supabase OAuth: ${supabaseEnabled ? "ENABLED ✓" : "disabled"}`);
      });
    })
    .catch((err) => {
      console.error("Database init failed:", err);
      process.exit(1);
    });
}

module.exports = app;
