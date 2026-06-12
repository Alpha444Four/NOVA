require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
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

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "nova-store",
    supabase: supabaseEnabled,
    database: db.usePg() ? "postgres" : "memory",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (db.findUserByEmail(email)) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }
  const user = db.createUser({ name: name.trim(), email: email.trim(), password });
  const token = auth.signToken(user);
  auth.setAuthCookie(res, token);
  res.status(201).json({ user: db.publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const bcrypt = require("bcryptjs");
  const user = db.findUserByEmail(email || "");
  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
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

app.get("/api/auth/me", (req, res) => {
  const user = auth.readUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user });
});

app.get("/api/products", (req, res) => {
  const products = db.getProducts({
    category: req.query.category,
    q: req.query.q,
    sort: req.query.sort,
  });
  res.json({ products });
});

app.get("/api/products/search", (req, res) => {
  const q = (req.query.q || "").trim();
  const products = q ? db.getProducts({ q }).slice(0, 8) : [];
  res.json({ products });
});

app.post("/api/newsletter/subscribe", (req, res) => {
  const email = (req.body?.email || "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Valid email required" });
  }
  db.subscribeNewsletter(email);
  res.json({ ok: true, code: "NOVA15" });
});

app.get("/api/newsletter/check", auth.requireAuth, (req, res) => {
  res.json({ subscribed: db.isNewsletterSubscriber(req.user.email) });
});

app.post("/api/orders", auth.requireAuth, (req, res) => {
  const { items, shipping, paymentMethod, applyDiscount } = req.body || {};
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Cart is empty" });
  }
  if (!shipping?.name || !shipping?.address || !shipping?.city || !shipping?.zip) {
    return res.status(400).json({ error: "Complete shipping address required" });
  }

  let subtotal = 0;
  const lineItems = items.map((item) => {
    const product = db.store.products.find((p) => p.id === item.productId);
    const price = product?.price ?? item.price ?? 0;
    const qty = Math.max(1, Number(item.qty) || 1);
    subtotal += price * qty;
    return {
      productId: item.productId,
      name: product?.name || item.name || "Product",
      price,
      qty,
    };
  });

  let discount = 0;
  if (applyDiscount && db.isNewsletterSubscriber(req.user.email)) {
    discount = Math.round(subtotal * 0.15 * 100) / 100;
  }
  const total = Math.round((subtotal - discount) * 100) / 100;

  const order = db.createOrder({
    userId: req.user.id,
    items: lineItems,
    shipping: { ...shipping, email: shipping.email || req.user.email },
    paymentMethod: paymentMethod === "card" ? "card" : "cod",
    total,
    discount,
  });

  res.status(201).json({
    order: {
      id: order.id,
      total: order.total,
      orderStatus: order.order_status,
    },
  });
});

app.get("/api/orders", auth.requireAuth, (req, res) => {
  res.json({ orders: db.getOrdersForUser(req.user.id) });
});

app.get("/api/admin/stats", auth.requireAdmin, (_req, res) => {
  res.json(db.adminStats());
});

app.get("/api/admin/products", auth.requireAdmin, (_req, res) => {
  res.json({ products: db.store.products });
});

app.get("/api/admin/orders", auth.requireAdmin, (_req, res) => {
  res.json({
    orders: db.store.orders.map((o) => ({
      id: o.id,
      userId: o.user_id,
      total: o.total,
      orderStatus: o.order_status,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      shippingName: o.shipping_name,
      createdAt: o.created_at,
      items: o.items,
    })),
  });
});

app.get("/api/admin/users", auth.requireAdmin, (_req, res) => {
  res.json({ users: db.store.users.map(db.publicUser) });
});

app.get("/api/admin/newsletter", auth.requireAdmin, (_req, res) => {
  res.json({ subscribers: db.store.newsletter });
});

app.post("/api/auth/oauth-exchange", (_req, res) => {
  if (!supabaseEnabled) {
    return res.status(503).json({ error: "OAuth is not configured on this deployment" });
  }
  res.status(501).json({ error: "OAuth exchange is not implemented in this build" });
});

// Local dev only — Vercel serves `public/` via CDN (express.static is ignored there).
if (!process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, "..", "public")));
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

db.initDb().catch((err) => console.error("DB init error:", err));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`NOVA Store → http://localhost:${PORT}`);
    console.log(`Supabase: ${supabaseEnabled ? "ENABLED ✓" : "disabled"}`);
  });
}

module.exports = app;
